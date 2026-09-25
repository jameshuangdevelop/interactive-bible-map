#Requires -Version 7
<#
.SYNOPSIS
Creates a Cloudflare account API token that can only deploy Cloudflare Pages, and
stores it, together with the account ID, as GitHub Actions secrets for this repository.

.DESCRIPTION
Run this yourself, in your own terminal. It asks for a short-lived "bootstrap" token
(created in the Cloudflare dashboard with the "Create account tokens" permission), uses
it to create a Pages-only token through the Cloudflare API, and writes the new token
straight into the CLOUDFLARE_API_TOKEN repository secret with the GitHub CLI.
No token value is ever printed.

API reference:
- Create Token:           https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/create/
- List Permission Groups: https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/subresources/permission_groups/methods/list/
- Verify / Delete Token:  https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/

.EXAMPLE
pwsh -File setup-cloudflare-token.ps1
#>
param(
    [string]$Repo = 'jameshuangdevelop/interactive-bible-map',
    [ValidateRange(1, 1095)][int]$ValidDays = 365,
    [string]$TokenName = 'interactive-bible-map GitHub Actions (Pages deploy)'
)

$ErrorActionPreference = 'Stop'
$api = 'https://api.cloudflare.com/client/v4'

gh auth status --hostname github.com *> $null
if ($LASTEXITCODE -ne 0) { throw 'The GitHub CLI is not logged in. Run "gh auth login" first.' }

$accountId = (Read-Host 'Cloudflare Account ID (the 32-character id in your dashboard URL)').Trim()
if ($accountId -notmatch '^[0-9a-f]{32}$') { throw 'An account ID is 32 lowercase hexadecimal characters.' }

$secure = Read-Host 'Bootstrap token (input hidden)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $bootstrap = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

function Invoke-Cloudflare([string]$Method, [string]$Path, $Body) {
    $request = @{
        Method      = $Method
        Uri         = "$api$Path"
        Headers     = @{ Authorization = "Bearer $bootstrap" }
        ContentType = 'application/json'
    }
    if ($null -ne $Body) { $request.Body = $Body | ConvertTo-Json -Depth 10 }
    try { $response = Invoke-RestMethod @request }
    catch {
        # Only the API's error messages are shown; request headers (the token) never are.
        $detail = $_.ErrorDetails.Message
        if ($detail) { try { $detail = (($detail | ConvertFrom-Json).errors | ForEach-Object message) -join '; ' } catch { } }
        throw "Cloudflare API $Method $Path failed: $(if ($detail) { $detail } else { $_.Exception.Message })"
    }
    if (-not $response.success) { throw "Cloudflare API $Method $Path failed: $(($response.errors | ForEach-Object message) -join '; ')" }
    $response.result
}

try {
    $bootstrapInfo = Invoke-Cloudflare GET "/accounts/$accountId/tokens/verify"
    Write-Host "Bootstrap token accepted (status: $($bootstrapInfo.status))."

    $scope = [uri]::EscapeDataString('com.cloudflare.api.account')
    $groups = @(Invoke-Cloudflare GET "/accounts/$accountId/tokens/permission_groups?scope=$scope")
    # Cloudflare lists this permission as "Pages Write" in the newer naming and
    # "Cloudflare Pages Edit" in the older one.
    $pages = $groups | Where-Object { $_.name -in @('Pages Write', 'Cloudflare Pages Write', 'Cloudflare Pages Edit', 'Pages Edit') } | Select-Object -First 1
    if (-not $pages) {
        $near = ($groups | Where-Object name -match 'Pages' | ForEach-Object name) -join ', '
        throw "No Pages write permission found. Permissions mentioning Pages: $near"
    }
    Write-Host "Using permission: $($pages.name)"

    $expiresOn = (Get-Date).ToUniversalTime().AddDays($ValidDays).ToString('yyyy-MM-ddTHH:mm:ssZ')
    $created = Invoke-Cloudflare POST "/accounts/$accountId/tokens" @{
        name       = $TokenName
        policies   = @(@{
                effect            = 'allow'
                permission_groups = @(@{ id = $pages.id })
                resources         = @{ "com.cloudflare.api.account.$accountId" = '*' }
            })
        expires_on = $expiresOn
    }
    if (-not $created.value) { throw 'Cloudflare created the token but returned no value; delete it in the dashboard and try again.' }

    # Values go in on standard input (gh strips the trailing newline), so the token never
    # appears on a command line. The non-secret account ID is stored first; if storing the
    # token then fails, the new token is deleted so no unused credential is left behind.
    $accountId | gh secret set CLOUDFLARE_ACCOUNT_ID --repo $Repo
    if ($LASTEXITCODE -ne 0) {
        Invoke-Cloudflare DELETE "/accounts/$accountId/tokens/$($created.id)" | Out-Null
        throw 'Storing CLOUDFLARE_ACCOUNT_ID failed, so the new Cloudflare token was deleted. Fix the GitHub CLI access and rerun.'
    }
    $created.value | gh secret set CLOUDFLARE_API_TOKEN --repo $Repo
    if ($LASTEXITCODE -ne 0) {
        Invoke-Cloudflare DELETE "/accounts/$accountId/tokens/$($created.id)" | Out-Null
        throw 'Storing CLOUDFLARE_API_TOKEN failed, so the new Cloudflare token was deleted. CLOUDFLARE_ACCOUNT_ID may already be set; that is harmless. Rerun the script.'
    }

    Write-Host ''
    Write-Host "Created token '$TokenName' (id $($created.id)), permission '$($pages.name)', expires $expiresOn."
    Write-Host "Stored repository secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in $Repo."

    $answer = Read-Host 'Delete the bootstrap token now? It is no longer needed. [Y/n]'
    if ($answer -notmatch '^[nN]') {
        Invoke-Cloudflare DELETE "/accounts/$accountId/tokens/$($bootstrapInfo.id)" | Out-Null
        Write-Host 'Bootstrap token deleted.'
    }
    else {
        Write-Host 'Remember to delete the bootstrap token in the Cloudflare dashboard.'
    }
}
finally {
    $bootstrap = $null
    if ($created) { $created.value = $null }
    [GC]::Collect()
}
