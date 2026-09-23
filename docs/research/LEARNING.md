# Learning list for CP1 (GIS + web mapping + RN Web/Expo)

At most 15 links, one-line each, focused on what the project needs first.

| Topic | Link | Why this is useful |
|---|---|---|
| GeoJSON standard | https://datatracker.ietf.org/doc/html/rfc7946 | Canonical spec for `Point`, `LineString`, `Polygon`, and coordinate rules. |
| `[lon, lat]` in MapLibre examples | https://maplibre.org/maplibre-gl-js/docs/ | Quick reminder that map coordinates are longitude first, latitude second. |
| Web Mercator + slippy tiles | https://docs.maptiler.com/google-maps-coordinates-tile-bounds-projection/ | Practical explanation of the projection/tile scheme used by most web maps. |
| Coordinate systems primer | https://docs.maptiler.com/guides/how-maps-work/coordinate-systems/ | Understand geographic vs projected coordinates before editing data. |
| Vector vs raster map usage | https://docs.maptiler.com/guides/account/sessions-vs-requests/ | Shows how map interactions translate into tile/API usage and billing. |
| MapLibre GL JS docs | https://maplibre.org/maplibre-gl-js/docs/ | Core web renderer docs for layers, sources, controls, and styling. |
| MapLibre style spec | https://maplibre.org/maplibre-style-spec/layers/ | Exact layer properties (including visibility/filtering) for custom map behavior. |
| react-map-gl get started | https://visgl.github.io/react-map-gl/docs/get-started | Fast path to wire MapLibre or Mapbox renderers into React UI components. |
| MapLibre React Native getting started | https://maplibre.org/maplibre-react-native/docs/setup/getting-started/ | Native map path for Expo/React Native when mobile app work starts. |
| React Native for Web intro | https://necolas.github.io/react-native-web/docs/ | Mental model for sharing React Native components on the web. |
| Expo development builds intro | https://docs.expo.dev/develop/development-builds/introduction/ | Explains why native map SDKs need dev builds (not Expo Go). |
| Vercel plan/usage docs | https://vercel.com/docs/plans/hobby | Helpful for understanding preview hosting limits and pause behavior. |
| Cloudflare Pages CI docs | https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ | Copyable GitHub Actions pattern for PR preview deployments. |
