import { buildModernLocationLabel } from "../src/features/map/modern-location-label";

describe("modern location label", () => {
  test("joins one country after the modern name", () => {
    expect(
      buildModernLocationLabel({
        modern: "Selçuk",
        modernCountries: ["Türkiye"]
      })
    ).toBe("Selçuk, Türkiye");
  });

  test("joins two countries with 'and'", () => {
    expect(
      buildModernLocationLabel({
        modern: "Parts of Syria",
        modernCountries: ["Lebanon", "Jordan"]
      })
    ).toBe("Parts of Syria, Lebanon and Jordan");
  });

  test("joins three countries with commas and 'and'", () => {
    expect(
      buildModernLocationLabel({
        modern: "Northern coast",
        modernCountries: ["Türkiye", "Syria", "Lebanon"]
      })
    ).toBe("Northern coast, Türkiye, Syria and Lebanon");
  });

  test("omits countries already present in the modern name, case-insensitively", () => {
    expect(
      buildModernLocationLabel({
        modern: "Central TÜRKİYE",
        modernCountries: ["Türkiye", "Greece"]
      })
    ).toBe("Central TÜRKİYE, Greece");
  });

  test("uses countries only for disputed places without one modern name", () => {
    expect(
      buildModernLocationLabel({
        modernCountries: ["Israel", "West Bank"]
      })
    ).toBe("Israel and the West Bank");
  });

  test("returns only the modern name when countries are unavailable", () => {
    expect(
      buildModernLocationLabel({
        modern: "Jerusalem"
      })
    ).toBe("Jerusalem");
  });

  test("returns null when a several-candidate record has no single modern name or countries", () => {
    expect(
      buildModernLocationLabel({
        modern: undefined,
        modernCountries: []
      })
    ).toBeNull();
  });
});
