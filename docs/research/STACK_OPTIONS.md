# M1-02 — Stack and hosting options with pricing

## Summary and recommendations (for CP1)
Recommend **MapLibre stack** (web: `react-map-gl/maplibre`, native later: `@maplibre/maplibre-react-native`) + **OpenFreeMap public basemap now** + **ancient GeoJSON overlays on a neutral base** + **Cloudflare Pages** + **no backend for MVP**.  
Runner-ups: **Mapbox stack** (library), **Protomaps PMTiles on Cloudflare R2** (modern basemap with more control), **ancient PMTiles archive** (if timeline data grows), **Vercel Pro** (hosting), and **Cloudflare Workers + D1** (backend).

This update changes the previous Mapbox cost logic: Mapbox’s own docs say Mapbox tiles consumed from **MapLibre/third-party renderers** are billed by **tile requests**, not web map-loads, so moderate traffic is much higher for that path. OpenFreeMap + MapLibre gives a no-account, low-lock-in free-tier path, and OpenMapTiles boundary fields allow hiding disputed borders when uncertain (brief §1.2).  

All source links below were read **2026-09-23**.

## GIS terms used in this document
| Term | Plain meaning |
|---|---|
| **GeoJSON** | GeoJSON is a JSON format for map features like points, lines, and polygons. |
| **Vector tile** | A vector tile is a small packet of map features that the client styles at runtime. |
| **Raster tile** | A raster tile is a pre-rendered image tile, so its style is fixed before delivery. |
| **Worldview** | A worldview is a region-specific border/label representation for disputed areas. |
| **Attribution** | Attribution is the legally required credit text for map data and map services. |
| **PMTiles** | PMTiles is a single-file tiled-data archive that can be hosted on object storage. |
| **XYZ tile URL** | An XYZ tile URL is a template like `/tiles/{z}/{x}/{y}.png`, where `z` is zoom and `x/y` are tile coordinates [S6][S48]. |
| **ODbL** | ODbL is the Open Database License used for OpenStreetMap-derived databases, with attribution duties [S37]. |
| **R2 Class A operation** | In Cloudflare R2, Class A operations are higher-cost state-changing/listing calls such as `PutObject` and `ListObjects` [S47]. |
| **R2 Class B operation** | In Cloudflare R2, Class B operations are lower-cost read/lookup calls such as `GetObject` and `HeadObject` [S47]. |

## Traffic assumptions and math
| Input | Hobby | Moderate | Notes |
|---|---:|---:|---|
| Visits / month | 1,000 | 50,000 | Required by card |
| Map initializations / visit | 1 | 1 | Session/map-load style billing assumption |
| **Map sessions / month** | 1,000 | 50,000 | visits × 1 |
| Tile/API requests / visit | 60 | 60 | Basis: initial map load + light pan/zoom path; **recalibrate from telemetry after M3** |
| **Tile/API requests / month** | 60,000 | 3,000,000 | visits × 60 |
| Hosting transfer / visit | 3 MB | 3 MB | Basis: JS bundle + styles + data payload after caching; **recalibrate after M3 telemetry** |
| **Hosting transfer / month** | 3 GB | 150 GB | visits × 3 MB |
| Hosting web/edge requests / visit | 40 | 40 | Basis: HTML + assets + API/data fetches for one map-screen journey; **recalibrate after M3 telemetry** |
| **Hosting web/edge requests / month** | 40,000 | 2,000,000 | visits × 40 |
| Backend API calls / visit (if used) | 3 | 3 | Search + detail lookups assumption |
| **Backend API calls / month** | 3,000 | 150,000 | visits × 3 |

---

## 1) Map library options (RN Web now, native app later)
| Option | Web now (React Native Web) | Native later (Expo/iOS/Android) | GeoJSON/vector/clustering | License | Maintenance snapshot | Pros | Cons | Monthly cost |
|---|---|---|---|---|---|---|---|---:|
| **A. MapLibre stack** (`react-map-gl/maplibre` + `@maplibre/maplibre-react-native`) | `react-map-gl` supports MapLibre [S2] | MapLibre RN docs target React Native/Expo path [S3] | MapLibre GL JS docs + RN docs cover GeoJSON, clustering, and style-layer controls [S1][S4][S5][S6] | BSD-3 (MapLibre GL JS) + MIT wrappers [S7][S8][S9] | Recent releases: GL JS, RN, and react-map-gl all active [S10][S11][S12] | Open-source renderer, low lock-in, consistent style model across web/native | Two renderer bindings to maintain (`.web` vs `.native`) | **$0** |
| **B. Mapbox stack** (`mapbox-gl-js` + `@rnmapbox/maps`) | Mapbox GL JS on web; `react-map-gl` also supports Mapbox [S2] | rnmapbox supports iOS/Android with Expo plugin (not Expo Go) [S15][S16] | GeoJSON + clustering examples available [S19][S20] | Mapbox GL JS v2+ under Mapbox terms; rnmapbox MIT [S13][S14][S15] | mapbox-gl-js and rnmapbox show ongoing releases [S17][S18] | Commercial ecosystem and tooling depth | Commercial terms + higher lock-in risk | **$0** library fee (service usage billed separately) |

**Recommendation:** **A. MapLibre stack**  
**Runner-up:** **B. Mapbox stack**

---

## 2) Basemap and tiles options (modern + ancient mode)

### 2.1 PO fix: Mapbox pricing with MapLibre is request-based
| Finding | Mapbox source | Effect on this card’s cost math |
|---|---|---|
| Mapbox APIs interoperate with third-party libraries like MapLibre. | “Use Mapbox APIs in MapLibre GL JS” [S24] | Using MapLibre with Mapbox tiles is a documented path. |
| When tiles are consumed through a third-party library, billing is tile-request based, not map-load bundled. | Mapbox-in-MapLibre pricing note [S24], plus third-party billing guide [S25] | Must use **tile request math** for MapLibre+Mapbox basemap estimates. |
| Vector Tiles API is billed by requests. | Vector Tiles API pricing section [S26] | We model requests from visits × requests/visit. |
| Current public price tiers for vector tiles are exposed in Mapbox’s pricing script. | `static-assets.mapbox.com/www/scripts/pricing/index.js` [S27] | 3,000,000 monthly requests estimates to **$650** (calculation below). |

### 2.2 Modern basemap options
| Option | Borders / disputed-border handling (brief §1.2) | License / terms | Attribution + API key | Limits behavior | Setup effort | Pros / Cons | Hobby cost | Moderate cost |
|---|---|---|---|---|---|---|---:|---:|
| **A. OpenFreeMap public vector styles** | OpenFreeMap says schema is unmodified OpenMapTiles [S31]; OpenMapTiles `boundary` layer includes `disputed` and `claimed_by`, so we can hide disputed lines when uncertain [S29]. | OpenFreeMap project is MIT; map data is from OpenStreetMap (ODbL upstream) [S31]. | Attribution required: OpenMapTiles + OpenStreetMap (and OpenFreeMap credit optional); MapLibre shows attribution automatically [S31]. API key: **No** [S31]. | No SLA/personal support currently; no published hard usage cap or overage table found (**unknown**) [S31]. | Lowest: use MapLibre style URL directly [S30]. | **Pros:** no account, $0, low lock-in. **Cons:** public-instance SLA unknown. | **$0** | **$0** |
| **B. Protomaps PMTiles (self-host, e.g., R2 + CDN)** | Full style control in MapLibre; disputed-boundary flag availability in Protomaps docs reviewed is **unknown**, so disputed handling may require custom overlay/filter policy [S37]. | Basemap repo states tilesets are ODbL (attribute OSM), map design CC0, and software BSD-3 [S37]. | API key: **No** (self-host). Attribution: OSM (and optional Protomaps shoutout) [S37]. | R2 free tier: 10 GB storage, 10M Class B reads, 1M Class A writes; overage is usage-charged, no egress fee [S47]. | Medium/high: generate or download PMTiles, host object, wire PMTiles protocol [S37][S38]. | **Pros:** strong control, no vendor map API lock-in. **Cons:** more ops/build complexity. | **$0 request/egress + storage unknown** | **$0 request/egress + storage unknown** |
| **C. MapTiler-hosted vector basemap** | Worldview/disputed-border customization documented; if uncertain, hide disputed border layers [S35][S36]. | Commercial service terms with API quotas/overage; upstream attribution requirements include OSM data credits [S32][S34]. | API key required; attribution required (Free plan also needs MapTiler logo) [S32][S34]. | Free plan pauses at quota; Flex auto-overage with optional spend cap [S32]. | Low/medium. | **Pros:** managed hosting and predictable plans. **Cons:** spend can rise quickly in request mode. | **$0** | **$92.50 (session mode)** or **~$405 (request mode)** |
| **D. Mapbox tiles rendered in MapLibre** | Worldview + boundary dataset support disputed handling [S21][S22]. | Mapbox docs explicitly allow third-party API use but bill by tile requests in this pattern; Mapbox GL JS itself is under Mapbox terms [S13][S24][S25]. | Access token required; Mapbox + OSM attribution required [S23][S24]. | Usage is billed by requests for third-party rendering [S24][S25][S26]. If invoice is unpaid after overage, account deactivation is documented [S28]. | Medium. | **Pros:** strong global coverage + documented worldview model. **Cons:** higher moderate-traffic cost in MapLibre flow. | **$0** | **$650** (Vector Tiles API request tiers) |

### 2.3 Modern-basemap cost math details
| Item | Formula | Hobby | Moderate |
|---|---|---:|---:|
| Mapbox vector tile requests | visits × 60 | 60,000 | 3,000,000 |
| Mapbox cost tier math | 0–200k free; 200k–2M at $0.25/1k; 2M–4M at $0.20/1k [S27] | $0 | (1,800×0.25)+(1,000×0.20)=**$650** |
| MapTiler request mode | Free ≤100k; Flex includes 500k then $0.15/1k [S32] | $0 | ~$405 |
| MapTiler session mode | Free ≤5k; Flex includes 25k then $2.50/1k [S32][S33] | $0 | $92.50 |
| Protomaps on R2 (Class B reads model) | max(0, requests−10,000,000)/1,000,000×$0.36 [S47] | $0 | $0 |
| Protomaps on R2 storage | max(0, GB−10)×$0.015/GB-mo [S47] | unknown | unknown |

**Modern recommendation:** **A. OpenFreeMap public vector styles**  
**Modern runner-up:** **B. Protomaps PMTiles self-hosted on R2** (if we need stronger control/SLA via our own infra)

**Production readiness note (launch gate):** because OpenFreeMap currently offers no SLA [S31], ship launch with tile-load error monitoring and a **pre-configured fallback basemap style** (for example Protomaps PMTiles self-host path [S37][S38] or another hosted free-tier style) that is switchable by config before go-live.

### 2.4 Ancient basemap implementation approaches (PO fix)
| Approach | MapLibre fit | Data size/performance at ~300 places + ~8 province snapshots | Timeline layer switching | Contested-border policy fit | Cost (hobby / moderate) | Notes |
|---|---|---|---|---|---:|---|
| **A. GeoJSON overlays on neutral modern base** | Native fit: add GeoJSON sources + style layers [S4][S5][S6] | At this scope, keep one active province snapshot + relevant routes visible; no tile build pipeline needed. Exact file size is **unknown** until data is finalized. | Switch by year property filter or layer visibility toggle [S5]. | Strong: use neutral base and hide disputed modern boundary lines (`disputed=1`) [S29]. | **$0 / $0** incremental | Best CP1/CP2 simplicity and clarity. |
| **B. Our own ancient vector tiles in PMTiles archive** | Vector source support + PMTiles integration path [S6][S38] | Better scaling if roads/provinces grow substantially; tiled delivery avoids full dataset transfer on first view. | Switch by source-layer or year filter in style expressions. | Strong: we control tile generation, so disputed/uncertain boundaries can be omitted. | **$0 request/egress; storage unknown / same** (if hosted on R2 pricing model [S47]) | More setup/maintenance than GeoJSON. |
| **C. Third-party ancient raster tiles (e.g., CAWM/DARE)** | Raster sources are supported [S6]; CAWM publishes XYZ tile URL examples [S48]; DARE example tiles exist [S49]. | Fast to integrate visually but no per-feature interactivity; style and labels are fixed in image tiles. | Only possible if provider exposes multiple epoch layers/URLs; otherwise timeline is mostly static. | Weak: disputed lines baked into pixels cannot be selectively hidden reliably. | **unknown / unknown** (no provider pricing table found on reviewed pages) | **License suitability review is deferred to M1-01** per task split. |

**Ancient recommendation:** **A. GeoJSON overlays on neutral base for MVP**  
**Ancient runner-up:** **B. PMTiles ancient archive** once timeline/history layers expand

---

## 3) Hosting options (static app + PR previews from GitHub Actions)
| Option | License / terms | PR preview/deploy path | Limits behavior | Pros / Cons (lock-in) | Hobby cost | Moderate cost |
|---|---|---|---|---|---:|---:|
| **A. Cloudflare Pages** | Proprietary hosted service under Cloudflare Self-Serve Subscription Agreement [S51]. | Direct upload CI and GitHub Actions with Wrangler are documented [S50]. | Pages limits include 500 builds/month on Free [S39]. For delivery: static asset requests are explicitly free and unlimited on free and paid plans [S40]. Free plan price is $0; Pro plan listed at $20/mo annually ($25 monthly billing) [S41]. | **Pros:** $0 static traffic, straightforward CI path. **Cons:** monthly build count cap on Free. **Lock-in:** low for static bundles (portable to other static hosts), medium if Pages Functions features are adopted. | **$0** | **$0** (static-only delivery model) |
| **B. Vercel** | Proprietary hosted service under Vercel Terms of Service [S52]. | Preview deploys for each git push and GitHub Actions path documented [S43][S45]. | Hobby includes 100 GB transfer + 1M edge requests; overage can pause/limit use on Hobby [S42][S44]. Pro is $20/mo and includes larger quotas [S42]. | **Pros:** excellent preview workflow defaults. **Cons:** paid plan likely needed at moderate traffic + policy limits on Hobby. **Lock-in:** low/medium for static bundles; higher if project depends on Vercel-specific platform features. | **$0** | **$20** (Pro) |

### Hosting traffic math
| Metric | Hobby | Moderate |
|---|---:|---:|
| Transfer | 1,000 × 3 MB = **3 GB** | 50,000 × 3 MB = **150 GB** |
| Web/edge requests | 1,000 × 40 = **40,000** | 50,000 × 40 = **2,000,000** |

**Recommendation:** **A. Cloudflare Pages**  
**Runner-up:** **B. Vercel Pro**

---

## 4) Is a backend needed?
Expected M1 scope data (~300 places + timeline provinces/roads/routes) is small enough for static delivery first.

| Option | What it means | License / terms | Pricing/limits source | Hobby monthly | Moderate monthly | Pros | Cons |
|---|---|---|---|---:|---:|---|---|
| **A. No backend (static JSON + client search)** | Serve JSON/GeoJSON from static hosting | JSON/GeoJSON are open formats (GeoJSON RFC) [S53]; hosting still follows chosen provider terms (Cloudflare [S51] or Vercel [S52]). | N/A | **$0** | **$0** | Lowest complexity and ops; highest portability across hosts | Less control over analytics/auth/edit workflows |
| **B. Small API + DB (Cloudflare Workers + D1)** | Search/filter API + optional editorial tooling | Proprietary managed services under Cloudflare Self-Serve terms [S51]. | Workers + D1 pricing/quotas [S46] | **$0** | **$0** | Leaves growth path without major replatform | More moving parts than static; moderate lock-in to Worker runtime/bindings |

Why option B still estimates $0 here: 150k API calls/month is below Workers Free daily cap (100k/day), and D1 free limits are high for this usage profile [S46].

**Recommendation:** **A. No backend for MVP**  
**Runner-up:** **B. Cloudflare Workers + D1**

---

## Risks and unknowns
1. **OpenFreeMap public-instance quota/overage policy is unknown** in reviewed pages; “no SLA/personal support” is explicit [S31]. **Mitigation:** monitor tile-load failure rate from launch day and keep a config-switch fallback style ready before go-live.  
2. **Fallback readiness is an execution risk**: Protomaps self-host requires medium/high setup [S37][S38], so fallback infra/style wiring must be prepared ahead of launch, not during an outage.  
3. **Protomaps storage cost depends on chosen extract size**, which is unknown before we choose region coverage and tile detail [S47].  
4. **Mapbox-in-MapLibre estimates here model Vector Tiles API requests only**; any additional billable non-tile API usage in a final style stack is unknown from reviewed pages [S24][S26][S27].  
5. **Ancient third-party tiles licensing compatibility** is intentionally deferred to M1-01/M1-03 per milestone split.  

---

## Decisions for CP1 (recommended + runner-up)
| Decision | Recommendation | Runner-up | Hobby monthly | Moderate monthly |
|---|---|---|---:|---:|
| Map library | **MapLibre stack** | Mapbox stack | $0 | $0 |
| Basemap/tiles | **OpenFreeMap modern + ancient GeoJSON overlays** | Protomaps PMTiles on R2 + ancient PMTiles archive | $0 | $0 (+ storage unknown if self-host path chosen) |
| Hosting | **Cloudflare Pages** | Vercel Pro | $0 | $0 (Cloudflare static) / $20 (Vercel Pro) |
| Backend | **No backend (static files)** | Cloudflare Workers + D1 | $0 | $0 |

---

## Draft ADR text for PO
### ADR draft — Map library
Use MapLibre renderers (`react-map-gl/maplibre` on web, `@maplibre/maplibre-react-native` for native later). This keeps renderer code open-source, supports vector tiles + GeoJSON overlays + clustering, and keeps an Expo migration path.

### ADR draft — Basemap and ancient mode
Use OpenFreeMap for modern basemap in CP1, with explicit style rules to hide disputed boundaries when uncertain (`disputed=1` on OpenMapTiles boundary data). Because OpenFreeMap has no SLA [S31], launch only with a config-switch fallback basemap style pre-wired (for example Protomaps PMTiles self-host path [S37][S38] or an alternate hosted style). For ancient mode, ship project-owned GeoJSON overlays first (provinces/roads/routes by timeline year) on a neutral base. Keep PMTiles as the scale-up path when timeline datasets grow.

### ADR draft — Hosting
Host static app/data on Cloudflare Pages and deploy via GitHub Actions + Wrangler. This preserves $0 static-request cost at the target traffic and provides preview deploy workflows.

### ADR draft — Backend
Start with static JSON + client search. Add Workers + D1 only if profiling or editor workflows require server-side query logic.

---

## Sources (all read 2026-09-23)
| ID | URL | Used for |
|---|---|---|
| S1 | https://maplibre.org/maplibre-gl-js/docs/ | MapLibre capability baseline |
| S2 | https://visgl.github.io/react-map-gl/docs/get-started | React wrapper support for MapLibre/Mapbox |
| S3 | https://maplibre.org/maplibre-react-native/docs/setup/getting-started/ | RN/Expo path for MapLibre |
| S4 | https://maplibre.org/maplibre-react-native/docs/components/sources/geo-json-source/ | GeoJSON + clustering in MapLibre RN |
| S5 | https://maplibre.org/maplibre-style-spec/layers/ | Layer visibility/filter controls |
| S6 | https://maplibre.org/maplibre-style-spec/sources/ | Vector/raster/GeoJSON source support |
| S7 | https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/LICENSE.txt | MapLibre GL JS license |
| S8 | https://raw.githubusercontent.com/visgl/react-map-gl/master/LICENSE | react-map-gl license |
| S9 | https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/LICENSE.md | MapLibre RN license |
| S10 | https://github.com/maplibre/maplibre-gl-js/releases.atom | MapLibre GL JS release activity |
| S11 | https://github.com/maplibre/maplibre-react-native/releases.atom | MapLibre RN release activity |
| S12 | https://github.com/visgl/react-map-gl/releases.atom | react-map-gl release activity |
| S13 | https://raw.githubusercontent.com/mapbox/mapbox-gl-js/main/LICENSE.txt | Mapbox GL JS license terms |
| S14 | https://docs.mapbox.com/help/glossary/maps-sdk-for-react-native/ | Mapbox statement on RN SDK support model |
| S15 | https://raw.githubusercontent.com/rnmapbox/maps/main/README.md | rnmapbox platform/support details |
| S16 | https://raw.githubusercontent.com/rnmapbox/maps/main/plugin/install.md | Expo plugin and Expo Go constraints |
| S17 | https://github.com/rnmapbox/maps/releases.atom | rnmapbox release activity |
| S18 | https://github.com/mapbox/mapbox-gl-js/releases.atom | mapbox-gl-js release activity |
| S19 | https://docs.mapbox.com/mapbox-gl-js/example/cluster/ | Mapbox clustering example |
| S20 | https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/ | Mapbox GeoJSON overlay example |
| S21 | https://docs.mapbox.com/help/glossary/worldview/ | Worldview concept |
| S22 | https://docs.mapbox.com/data/boundaries/reference/mapbox-boundaries-v4/ | Disputed boundaries + worldview filtering |
| S23 | https://docs.mapbox.com/help/glossary/attribution/ | Attribution requirements |
| S24 | https://docs.mapbox.com/help/ja/dive-deeper/mapbox-in-maplibre/ | Mapbox APIs in MapLibre + third-party billing note |
| S25 | https://docs.mapbox.com/accounts/guides/pricing/ | Third-party tools / tile-request billing guidance |
| S26 | https://docs.mapbox.com/api/maps/vector-tiles/ | Vector Tiles API request-metered pricing model |
| S27 | https://static-assets.mapbox.com/www/scripts/pricing/index.js | Mapbox vector tile price tiers used in math |
| S28 | https://docs.mapbox.com/help/troubleshooting/blank-tiles/ | Account deactivation behavior when invoices fail |
| S29 | https://raw.githubusercontent.com/openmaptiles/openmaptiles/master/layers/boundary/boundary.yaml | `disputed` / `claimed_by` boundary fields |
| S30 | https://openfreemap.org/quick_start/ | MapLibre setup + mobile path + self-hosting pointer |
| S31 | https://openfreemap.org/ | Free/commercial status, attribution, schema statement, support/SLA status |
| S32 | https://www.maptiler.com/cloud/pricing/ | MapTiler plans, free tier, overage, pause behavior |
| S33 | https://docs.maptiler.com/guides/account/sessions-vs-requests/ | Session vs request billing differences |
| S34 | https://docs.maptiler.com/guides/map-design/attribution/add-attribution/ | MapTiler attribution requirements |
| S35 | https://www.maptiler.com/news/2023/08/design-amazing-maps-with-our-new-style-editor/ | MapTiler worldview/disputed-border customization |
| S36 | https://docs.maptiler.com/gl-style-specification/layers/ | Style-layer visibility controls |
| S37 | https://github.com/protomaps/basemaps/blob/main/README.md | Protomaps basemap workflow + licensing/attribution |
| S38 | https://github.com/protomaps/PMTiles/blob/main/README.md | PMTiles format + MapLibre/serverless usage path |
| S39 | https://developers.cloudflare.com/pages/platform/limits/ | Cloudflare Pages build/platform limits |
| S40 | https://developers.cloudflare.com/pages/functions/pricing/ | “Static asset requests are free and unlimited” |
| S41 | https://www.cloudflare.com/plans/network-cdn.md | Cloudflare Free/Pro price points |
| S42 | https://vercel.com/pricing | Vercel plan prices and included quotas |
| S43 | https://vercel.com/docs/plans | Preview deployment behavior |
| S44 | https://vercel.com/docs/plans/hobby | Hobby limits and behavior |
| S45 | https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel | GitHub Actions deployment path |
| S46 | https://developers.cloudflare.com/workers/platform/pricing/ | Workers + D1 quotas/rates |
| S47 | https://developers.cloudflare.com/r2/pricing/ | R2 storage/operation pricing and free tier |
| S48 | https://cawm.lib.uiowa.edu/index.html | CAWM raster tile endpoint and citation/license page |
| S49 | https://raw.githubusercontent.com/klokantech/dare-raster-tiles/gh-pages/README.md | DARE raster tiles availability example |
| S50 | https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ | Cloudflare Pages CI deployment from GitHub Actions/Wrangler |
| S51 | https://www.cloudflare.com/terms/ | Cloudflare Self-Serve Subscription Agreement (hosted service terms) |
| S52 | https://vercel.com/legal/terms | Vercel Terms of Service (hosted service terms) |
| S53 | https://datatracker.ietf.org/doc/html/rfc7946 | GeoJSON open standard reference |
