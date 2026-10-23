const basemapHosts = new Set(["tiles.openfreemap.org", "tiles.versatiles.org"]);
const localHosts = new Set(["127.0.0.1", "localhost"]);

export function isLocalhostUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    return localHosts.has(parsedUrl.hostname);
  } catch {
    return true;
  }
}

export function isWikimediaCommonsUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    return (
      parsedUrl.hostname === "upload.wikimedia.org" &&
      parsedUrl.pathname.includes("/wikipedia/commons/")
    );
  } catch {
    return false;
  }
}

export function classifyBasemapUrl(urlString) {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return { isBasemapHost: false, resourceType: "other" };
  }

  if (!basemapHosts.has(parsedUrl.hostname)) {
    return { isBasemapHost: false, resourceType: "other" };
  }

  const pathname = parsedUrl.pathname;
  if (/^\/planet\/[^/]+\/\d+\/\d+\/\d+\.pbf$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "vector-tile" };
  }
  if (/^\/tiles\/osm\/\d+\/\d+\/\d+$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "vector-tile" };
  }
  if (/^\/natural_earth\/ne2sr\/\d+\/\d+\/\d+\.png$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "raster-relief-tile" };
  }
  if (pathname === "/planet" || /^\/planet\/[^/]+\/tiles\.json$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "tilejson" };
  }
  if (/^\/fonts\/[^/]+\/\d+-\d+\.pbf$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "glyph" };
  }
  if (/^\/assets\/glyphs\/[^/]+\/\d+-\d+\.pbf$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "glyph" };
  }
  if (/^\/sprites\/[^/]+\/[^/]+\.(?:json|png)$/u.test(pathname)) {
    return { isBasemapHost: true, resourceType: "sprite" };
  }

  return { isBasemapHost: true, resourceType: "other-basemap" };
}

export function decideReplayRequestPolicy({ url, hasFixtureEntry }) {
  if (isLocalhostUrl(url)) {
    return { type: "local" };
  }

  if (isWikimediaCommonsUrl(url)) {
    return { type: "wikimedia-placeholder" };
  }

  const basemapInfo = classifyBasemapUrl(url);
  if (basemapInfo.isBasemapHost) {
    if (hasFixtureEntry) {
      return { type: "fixture-basemap", basemapResourceType: basemapInfo.resourceType };
    }

    if (basemapInfo.resourceType === "vector-tile") {
      return { type: "missing-vector-tile", status: 204 };
    }

    if (basemapInfo.resourceType === "raster-relief-tile") {
      return { type: "missing-raster-relief-tile", status: 200 };
    }

    if (basemapInfo.resourceType === "glyph") {
      return { type: "missing-glyph", status: 200 };
    }

    return { type: "missing-strict-basemap", basemapResourceType: basemapInfo.resourceType };
  }

  return { type: "blocked-external" };
}
