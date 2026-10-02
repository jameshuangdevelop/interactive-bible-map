const COMMONS_PREFIX = "/wikipedia/commons/";
const COMMONS_THUMB_PREFIX = "/wikipedia/commons/thumb/";

export const COMMONS_THUMBNAIL_WIDTHS = [330, 500, 960, 1280] as const;

function toCommonsOriginalPathname(pathname: string) {
  if (pathname.startsWith(COMMONS_THUMB_PREFIX)) {
    const relativePath = pathname.slice(COMMONS_THUMB_PREFIX.length);
    const segments = relativePath.split("/").filter((segment) => segment.length > 0);
    if (segments.length < 4) {
      return null;
    }

    const originalPathSegments = segments.slice(0, -1);
    const fileName = originalPathSegments[originalPathSegments.length - 1];
    const thumbnailFileName = segments[segments.length - 1];
    if (
      !fileName ||
      !thumbnailFileName ||
      !/^[1-9][0-9]*px-/u.test(thumbnailFileName) ||
      !thumbnailFileName.endsWith(fileName)
    ) {
      return null;
    }

    return `${COMMONS_PREFIX}${originalPathSegments.join("/")}`;
  }

  if (pathname.startsWith(COMMONS_PREFIX)) {
    return pathname;
  }

  return null;
}

export function selectCommonsThumbnailWidth(targetWidth: number) {
  const normalizedTarget = Number.isFinite(targetWidth)
    ? Math.max(1, Math.round(targetWidth))
    : COMMONS_THUMBNAIL_WIDTHS[0];

  for (const width of COMMONS_THUMBNAIL_WIDTHS) {
    if (normalizedTarget <= width) {
      return width;
    }
  }

  return COMMONS_THUMBNAIL_WIDTHS[COMMONS_THUMBNAIL_WIDTHS.length - 1];
}

export function buildCommonsThumbnailUrl(originalUrl: string, targetWidth: number) {
  try {
    const parsed = new URL(originalUrl);
    parsed.search = "";
    parsed.hash = "";

    const commonsOriginalPath = toCommonsOriginalPathname(parsed.pathname);
    if (!commonsOriginalPath) {
      return parsed.toString();
    }

    const relativePath = commonsOriginalPath.slice(COMMONS_PREFIX.length);
    const segments = relativePath.split("/").filter((segment) => segment.length > 0);
    const fileName = segments[segments.length - 1];
    if (!fileName || segments.length < 3) {
      return parsed.toString();
    }

    const width = selectCommonsThumbnailWidth(targetWidth);
    parsed.pathname = `${COMMONS_THUMB_PREFIX}${relativePath}/${width}px-${fileName}`;
    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

export function buildCommonsThumbnailSrcSet(originalUrl: string) {
  try {
    const parsed = new URL(originalUrl);
    const commonsOriginalPath = toCommonsOriginalPathname(parsed.pathname);
    if (!commonsOriginalPath) {
      return null;
    }
  } catch {
    return null;
  }

  return COMMONS_THUMBNAIL_WIDTHS.map(
    (width) => `${buildCommonsThumbnailUrl(originalUrl, width)} ${width}w`
  ).join(", ");
}
