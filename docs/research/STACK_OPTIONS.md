# M1-02 — Stack and hosting options with pricing

## Summary and recommendations (for CP1)
Recommend **MapLibre stack** (web: `react-map-gl/maplibre`, native later: `@maplibre/maplibre-react-native`) + **Mapbox-hosted modern basemap** + **Cloudflare Pages hosting** + **no backend for MVP (static JSON + client search)**.  
Runner-ups: **Mapbox stack** for maps, **MapTiler-hosted basemap**, **Vercel Pro** hosting, and **Cloudflare Workers + D1** if we need server-side search later.

Why: MapLibre keeps app code open-source and supports a clean React Native Web now / Expo-native-later path, while Mapbox gives the clearest disputed-border controls and predictable map-load billing at our current traffic. Cloudflare Pages is low-ops and supports PR preview automation from GitHub Actions. A backend is optional for the expected dataset size (~300 places + provinces/roads/routes); static files remain simpler and cheaper at hobby and moderate traffic.  

All source links below were read **2026-09-23**.

## GIS terms used in this document
| Term | Plain meaning |
|---|---|
| **GeoJSON** | GeoJSON is a JSON format for map features like points, lines, and polygons. |
| **Vector tiles** | A vector tile is a small packet of map features for one zoom tile, styled by the client at runtime. |
| **Raster tiles** | A raster tile is a pre-rendered image tile (PNG/JPEG), so styling is baked in before delivery. |
| **Worldview** | A worldview is a map variant for a specific regional perspective on disputed borders/labels. |
| **Attribution** | Attribution is the legally required credit text/logo for map data and map service providers. |
| **Web Mercator** | Web Mercator is the standard projection used by most slippy web maps; it preserves shape locally but distorts area. |

## Traffic assumptions and math
| Input | Hobby | Moderate | Notes |
|---|---:|---:|---|
| Visits / month | 1,000 | 50,000 | Required by task card |
| Map initializations / visit | 1 | 1 | Assumption for map-load/session priced products |
| **Map loads / sessions / month** | 1,000 | 50,000 | visits × 1 |
| Tile requests / visit (request-metered scenario) | 60 | 60 | Assumption for request-priced tiles (initial viewport + some pan/zoom) |
| **Tile/API requests / month** | 60,000 | 3,000,000 | visits × 60 |
| Hosting data transfer / visit | 3 MB | 3 MB | Assumption (JS bundle + styles + JSON data, after caching) |
| **Hosting transfer / month** | 3 GB | 150 GB | visits × 3 MB |
| Backend API calls / visit (if API exists) | 3 | 3 | Assumption (search + detail fetches) |
| **Backend API calls / month** | 3,000 | 150,000 | visits × 3 |

---

## 1) Map library options (RN Web now, native app later)
| Option | Web now (React Native Web) | Native later (Expo/iOS/Android) | Vector tiles + GeoJSON overlays + clustering | License | Maintenance snapshot | Pros | Cons | Monthly cost |
|---|---|---|---|---|---|---|---|---:|
| **A. MapLibre stack** (`react-map-gl/maplibre` + `@maplibre/maplibre-react-native`) | `react-map-gl` has a MapLibre path/import and examples [S2] | MapLibre RN docs explicitly target Expo/React Native and wrap MapLibre Native (Android+iOS) [S3] | MapLibre GL JS and RN GeoJSON source support GeoJSON and clustering [S1][S4]; style-layer visibility controls exist [S5] | BSD-3-Clause (MapLibre GL JS) [S6] + MIT (`react-map-gl`, MapLibre RN) [S7][S8] | Recent releases: GL JS 2026-09-23 [S9], RN 2026-09-19 [S10], react-map-gl 2026-09-02 [S11] | Open stack, no renderer lock-in, strong custom layer/styling control | Two renderers/components to maintain (`.web` vs `.native`) | **$0** library fee (tiles/hosting separate) |
| **B. Mapbox stack** (`mapbox-gl-js` + `@rnmapbox/maps`) | Mapbox GL JS is web-focused; `react-map-gl` supports Mapbox path [S2] | rnmapbox is community-maintained, for iOS/Android, with Expo plugin (not Expo Go) [S13][S14][S15] | Mapbox docs show GeoJSON overlays and built-in clustering [S18][S19] | Mapbox GL JS v2+ is under Mapbox TOS (active account required) [S12]; rnmapbox wrapper is MIT [S14] | mapbox-gl-js release 2026-09-23 [S17], rnmapbox release 2026-07-22 [S16] | Mature commercial ecosystem; same vendor for web/mobile billing | Vendor lock-in + commercial terms; rnmapbox has community (not vendor) support [S13] | **$0** library fee (usage billed via Mapbox services) |

**Recommendation:** **A. MapLibre stack**  
**Runner-up:** **B. Mapbox stack**

---

## 2) Basemap and tiles options (modern map + contested-border handling)
| Option | Modern borders + contested-border policy | Attribution + key | Limits behavior | Pricing at hobby (1k) | Pricing at moderate (50k) |
|---|---|---|---|---:|---:|
| **A. Mapbox-hosted vector basemap (Mapbox GL JS map-load billing)** | Mapbox supports worldview-specific disputed representations [S20][S21]. For brief §1.2: pick one mainstream worldview and hide disputed boundary layers when uncertain (style visibility/filtering) [S21][S5]. | Requires Mapbox token/account [S19][S12]. Attribution must include Mapbox + OSM links [S22]. | Map-load tiers are published (free tier then per-1k charges) [S24]; Mapbox docs define map-load counting (1 map init, unlimited interactions) [S23]. **Hard-cap behavior on free tier: unknown** (not explicit in docs reviewed). | **$0** (1,000 map loads; free up to 50,000) [S24] | **$0** (50,000 map loads; still at free boundary) [S24] |
| **B. MapTiler-hosted vector basemap** | MapTiler supports worldview/disputed-border settings in map customization [S28]. If uncertain, hide border layers via style visibility [S30]. | API key required; must use own key [S25][S26]. Attribution text required; Free plan also requires MapTiler logo [S27]. | Free plan pauses service at quota; Flex plan charges overage automatically (optional spend limit) [S25]. | **$0** (Free: 5k sessions or 100k API requests, depending mode) [S25][S26] | **$92.50** in session mode (Flex: $30 + 25k extra sessions × $2.50/1k) [S25]. **Request-mode estimate:** ~**$405** with 60 requests/visit (3.0M req total; Flex includes 500k then $0.15/1k) [S25] |

### Basemap pricing math
| Item | Formula | Hobby | Moderate |
|---|---|---:|---:|
| Mapbox map loads | visits × 1 load | 1,000 | 50,000 |
| Mapbox monthly cost | Tiered from pricing table [S24] | $0 | $0 |
| MapTiler sessions (session mode) | visits × 1 session | 1,000 | 50,000 |
| MapTiler monthly cost (session mode) | Free(≤5k) else $30 + max(0, sessions−25k)/1000×$2.50 [S25] | $0 | $92.50 |
| MapTiler requests (request mode) | visits × 60 requests | 60,000 | 3,000,000 |
| MapTiler monthly cost (request mode) | Free(≤100k) else $30 + max(0, req−500k)/1000×$0.15 [S25] | $0 | $405 |

**Recommendation:** **A. Mapbox-hosted basemap** (best cost predictability at current traffic + explicit worldview/dispute support)  
**Runner-up:** **B. MapTiler-hosted basemap** (good customization, but request-mode cost can climb fast unless session mode is used)

---

## 3) Hosting options (static app + PR previews from GitHub Actions)
| Option | PR preview path | Relevant limits/plan facts | Pricing at hobby (1k visits) | Pricing at moderate (50k visits) |
|---|---|---|---:|---:|
| **A. Cloudflare Pages** | Cloudflare documents direct upload CI and GitHub Actions with `wrangler pages deploy` [S32]. Pages previews can be unlimited [S31]. | Free plan has 500 builds/month and 1 concurrent build [S31]. Cloudflare Free plan price is $0; Pro is $20/mo [S33]. | **$0** (Free plan fee) | **$0** (Free plan fee; traffic overage behavior for static delivery is **unknown** in reviewed docs) |
| **B. Vercel** | Vercel supports preview deployments for every git push [S35] and documents GitHub Actions + `vercel deploy --prebuilt` [S37]. | Hobby includes 100 GB transfer + 1M edge requests; at overage hobby features may pause until window resets [S34][S36]. Pro is $20/month and includes 1 TB + 10M edge requests [S34]. | **$0** (assumed 3 GB transfer + 40k requests fits Hobby) | **$20** (use Pro for 150 GB + ~2M requests and to avoid Hobby pauses/non-commercial constraints) |

### Hosting traffic math (assumption-driven)
| Metric | Hobby | Moderate |
|---|---:|---:|
| Transfer | 1,000 × 3 MB = **3 GB** | 50,000 × 3 MB = **150 GB** |
| Web/edge requests | 1,000 × 40 = **40,000** | 50,000 × 40 = **2,000,000** |

**Recommendation:** **A. Cloudflare Pages**  
**Runner-up:** **B. Vercel Pro**

---

## 4) Backend needed?
Expected data volume from brief is small for MVP (~300 locations + limited timeline/provinces/roads/routes), so static delivery is viable.

| Option | What it means | Pricing source | Hobby monthly | Moderate monthly | Notes |
|---|---|---|---:|---:|---|
| **A. No backend (static JSON + client-side search)** | Serve JSON/GeoJSON files from static hosting; search/filter in client | N/A | **$0** | **$0** | Lowest complexity; good fit for current scale |
| **B. Small API + DB (Cloudflare Workers + D1)** | API for search/filter, optional data normalization and logging | Workers + D1 rates/quotas [S38] | **$0** | **$0** | With 3 API calls/visit, 150k req/mo is within Workers Free (100k/day). D1 free quotas also ample for this workload [S38]. |

**Recommendation:** **A. No backend for MVP**  
**Runner-up:** **B. Cloudflare Workers + D1** (only if server-side search/auth/content editing becomes mandatory)

---

## Risks and unknowns
1. **Mapbox free-tier hard-cap behavior is unknown** in docs reviewed; pricing tiers are clear, but pause/block wording was not found on the pages we checked ([S23], [S24]).  
2. **Cloudflare Pages static traffic overage behavior is unknown** from the reviewed pricing/limits docs; we found plan fees and build limits, but no explicit per-GB static-delivery charge table for Pages ([S31], [S33]).  
3. **MapTiler cost varies a lot by billing mode** (sessions vs requests) and by interaction depth; we provided both session and request calculations ([S25], [S26]).  
4. **Ancient-layer source licensing** for specific historical datasets remains with M1-01/M1-03; this doc only compares platform costs and capabilities.

---

## Decisions for CP1 (recommended + runner-up)
| Decision | Recommendation | Runner-up | Hobby monthly | Moderate monthly |
|---|---|---|---:|---:|
| Map library | **MapLibre stack** | Mapbox stack | $0 | $0 |
| Basemap/tiles | **Mapbox hosted** | MapTiler hosted | $0 | $0 (Mapbox) / $92.50 session-mode (MapTiler) |
| Hosting | **Cloudflare Pages** | Vercel Pro | $0 | $0 (Cloudflare fee model) / $20 (Vercel Pro) |
| Backend | **No backend (static)** | Cloudflare Workers + D1 | $0 | $0 |

---

## Draft ADR text for PO
### ADR draft — Map library
Use a split MapLibre renderer strategy: `react-map-gl/maplibre` on web and `@maplibre/maplibre-react-native` for native. This keeps renderer code open-source, supports vector tiles + GeoJSON overlays + clustering across web/native, and preserves an Expo migration path.

### ADR draft — Basemap/tiles
Use Mapbox-hosted modern basemap initially because map-load pricing is predictable at current traffic and worldview/disputed-boundary controls are explicitly documented. Policy: if disputed border treatment is uncertain, hide the disputed line layer.

### ADR draft — Hosting
Host on Cloudflare Pages with GitHub Actions + Wrangler deploys for PR previews and production deploys. Keep Vercel Pro as fallback if Cloudflare Pages limits or org policy become blockers.

### ADR draft — Backend
Start without a backend (static JSON + client-side search). Introduce a minimal API (Cloudflare Workers + D1) only if profiling shows client search latency or editorial workflows require server logic.

---

## Sources (all read 2026-09-23)
| ID | URL | Used for |
|---|---|---|
| S1 | https://maplibre.org/maplibre-gl-js/docs/ | MapLibre GL JS capabilities and platform context |
| S2 | https://visgl.github.io/react-map-gl/docs/get-started | React wrapper support for Mapbox/MapLibre |
| S3 | https://maplibre.org/maplibre-react-native/docs/setup/getting-started/ | Expo/native path for MapLibre RN |
| S4 | https://maplibre.org/maplibre-react-native/docs/components/sources/geo-json-source/ | GeoJSON + clustering support in RN |
| S5 | https://maplibre.org/maplibre-style-spec/layers/ | Layer visibility controls (`visible`/`none`) |
| S6 | https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/LICENSE.txt | MapLibre GL JS license |
| S7 | https://raw.githubusercontent.com/visgl/react-map-gl/master/LICENSE | react-map-gl license |
| S8 | https://raw.githubusercontent.com/maplibre/maplibre-react-native/main/LICENSE.md | MapLibre RN license |
| S9 | https://github.com/maplibre/maplibre-gl-js/releases.atom | MapLibre GL JS release activity |
| S10 | https://github.com/maplibre/maplibre-react-native/releases.atom | MapLibre RN release activity |
| S11 | https://github.com/visgl/react-map-gl/releases.atom | react-map-gl release activity |
| S12 | https://raw.githubusercontent.com/mapbox/mapbox-gl-js/main/LICENSE.txt | Mapbox GL JS licensing terms |
| S13 | https://docs.mapbox.com/help/glossary/maps-sdk-for-react-native/ | rnmapbox maintenance/support model |
| S14 | https://raw.githubusercontent.com/rnmapbox/maps/main/README.md | rnmapbox supported platforms and positioning |
| S15 | https://raw.githubusercontent.com/rnmapbox/maps/main/plugin/install.md | Expo support and Expo Go limitation |
| S16 | https://github.com/rnmapbox/maps/releases.atom | rnmapbox release activity |
| S17 | https://github.com/mapbox/mapbox-gl-js/releases.atom | mapbox-gl-js release activity |
| S18 | https://docs.mapbox.com/mapbox-gl-js/example/cluster/ | Cluster support example |
| S19 | https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/ | GeoJSON overlay example + token requirement in sample |
| S20 | https://docs.mapbox.com/help/glossary/worldview/ | Mapbox worldview concept for disputed boundaries |
| S21 | https://docs.mapbox.com/data/boundaries/reference/mapbox-boundaries-v4/ | Disputed boundaries + worldview filtering |
| S22 | https://docs.mapbox.com/help/glossary/attribution/ | Mapbox attribution requirements |
| S23 | https://docs.mapbox.com/mapbox-gl-js/guides/pricing/ | Map-load definition and session window |
| S24 | https://www.mapbox.com/pricing | Mapbox map-load and MAU pricing tiers |
| S25 | https://www.maptiler.com/cloud/pricing/ | MapTiler plans, quotas, overage rates, free-limit behavior |
| S26 | https://docs.maptiler.com/guides/account/sessions-vs-requests/ | Session vs request billing behavior |
| S27 | https://docs.maptiler.com/guides/map-design/attribution/add-attribution/ | MapTiler attribution requirements |
| S28 | https://www.maptiler.com/news/2023/08/design-amazing-maps-with-our-new-style-editor/ | MapTiler disputed-border/worldview customization |
| S30 | https://docs.maptiler.com/gl-style-specification/layers/ | MapTiler layer visibility controls |
| S31 | https://developers.cloudflare.com/pages/platform/limits/ | Cloudflare Pages limits + preview deployments |
| S32 | https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ | GitHub Actions deployment to Pages |
| S33 | https://www.cloudflare.com/plans/network-cdn.md | Cloudflare plan pricing (Free/Pro/Business) |
| S34 | https://vercel.com/pricing | Vercel plan prices + usage bundles |
| S35 | https://vercel.com/docs/plans | Vercel preview deployments for every Git push, usage behavior |
| S36 | https://vercel.com/docs/plans/hobby | Hobby limits and pause behavior |
| S37 | https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel | GitHub Actions deployment pattern for previews |
| S38 | https://www.cloudflare.com/plans | Workers and D1 free/paid quotas and rates |
