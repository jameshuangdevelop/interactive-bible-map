import {
  COMMONS_THUMBNAIL_WIDTHS,
  buildCommonsThumbnailSrcSet,
  buildCommonsThumbnailUrl,
  selectCommonsThumbnailWidth,
  selectCommonsThumbnailWidthForFrame
} from "../src/features/place-panel/commons-thumbnail";

describe("commons thumbnail helpers", () => {
  test("uses allow-listed widths and strips query/hash from Commons URLs", () => {
    const url =
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kafarnaum_BW_7.JPG?utm_source=test#ignored";

    expect(selectCommonsThumbnailWidth(408)).toBe(500);
    expect(selectCommonsThumbnailWidth(816)).toBe(960);
    expect(buildCommonsThumbnailUrl(url, 408)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Kafarnaum_BW_7.JPG/500px-Kafarnaum_BW_7.JPG"
    );
  });

  test("builds thumbnails for non-JPEG Commons files", () => {
    const pngUrl = "https://upload.wikimedia.org/wikipedia/commons/a/aa/Example_Map.png?utm_source=foo";

    expect(buildCommonsThumbnailUrl(pngUrl, 900)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Example_Map.png/960px-Example_Map.png"
    );
  });

  test("builds SVG thumbnails with Commons .png raster suffix", () => {
    const svgUrl = "https://upload.wikimedia.org/wikipedia/commons/e/ed/Galatia_Map.svg?utm_source=foo";

    expect(buildCommonsThumbnailUrl(svgUrl, 500)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Galatia_Map.svg/500px-Galatia_Map.svg.png"
    );
    const srcSet = buildCommonsThumbnailSrcSet(svgUrl);
    for (const width of COMMONS_THUMBNAIL_WIDTHS) {
      expect(srcSet).toContain(
        `https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Galatia_Map.svg/${width}px-Galatia_Map.svg.png ${width}w`
      );
    }
  });

  test("builds responsive srcset from allow-listed widths", () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/f/f0/Filename.jpg?utm_source=source";
    const srcSet = buildCommonsThumbnailSrcSet(url);

    expect(srcSet).not.toBeNull();
    for (const width of COMMONS_THUMBNAIL_WIDTHS) {
      expect(srcSet).toContain(
        `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Filename.jpg/${width}px-Filename.jpg ${width}w`
      );
    }
    expect(srcSet).not.toContain("utm_source=");
  });

  test("keeps repo-hosted AI image paths unchanged", () => {
    const aiPath = "media/ai/capernaum-ai-01.webp";
    expect(buildCommonsThumbnailUrl(aiPath, 1280)).toBe(aiPath);
    expect(buildCommonsThumbnailSrcSet(aiPath)).toBeNull();
  });

  test("picks shape-aware widths from rendered frame height and DPR", () => {
    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 1,
        originalWidth: 4032,
        originalHeight: 3024
      })
    ).toBe(330);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 2,
        originalWidth: 4032,
        originalHeight: 3024
      })
    ).toBe(960);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 1,
        originalWidth: 4000,
        originalHeight: 2250
      })
    ).toBe(500);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 2,
        originalWidth: 4000,
        originalHeight: 2250
      })
    ).toBe(960);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 1,
        originalWidth: 13068,
        originalHeight: 2516
      })
    ).toBe(1280);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 2,
        originalWidth: 13068,
        originalHeight: 2516
      })
    ).toBe(1280);
  });

  test("caps shape-aware widths to original width and falls back when tiny", () => {
    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 2,
        originalWidth: 420,
        originalHeight: 315
      })
    ).toBe(330);

    expect(
      selectCommonsThumbnailWidthForFrame({
        renderedWidth: 408,
        renderedHeight: 240,
        devicePixelRatio: 2,
        originalWidth: 260,
        originalHeight: 200
      })
    ).toBeNull();
  });
});
