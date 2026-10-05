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

  test("omits a country when the modern phrase already contains it as a whole word", () => {
    expect(
      buildModernLocationLabel({
        modern: "Near the Jordan River",
        modernCountries: ["Jordan", "Israel"]
      })
    ).toBe("Near the Jordan River, Israel");
  });

  test("keeps a country when the modern phrase contains it only inside another word", () => {
    expect(
      buildModernLocationLabel({
        modern: "Jordanian highlands",
        modernCountries: ["Jordan"]
      })
    ).toBe("Jordanian highlands, Jordan");
  });

  test("omits a multi-word country only when the phrase appears as whole words", () => {
    expect(
      buildModernLocationLabel({
        modern: "Southern North Macedonia foothills",
        modernCountries: ["North Macedonia", "Greece"]
      })
    ).toBe("Southern North Macedonia foothills, Greece");
  });

  test("omits articles for West Bank and Golan Heights directly after a modern name", () => {
    expect(
      buildModernLocationLabel({
        modern: "Bethlehem",
        modernCountries: ["West Bank"]
      })
    ).toBe("Bethlehem, West Bank");

    expect(
      buildModernLocationLabel({
        modern: "Banias",
        modernCountries: ["Golan Heights"]
      })
    ).toBe("Banias, Golan Heights");
  });

  test("uses countries only for disputed places without one modern name", () => {
    expect(
      buildModernLocationLabel({
        modernCountries: ["Israel", "West Bank"]
      })
    ).toBe("Israel and the West Bank");
  });

  test("uses 'the' for West Bank and Golan Heights when countries stand alone", () => {
    expect(
      buildModernLocationLabel({
        modernCountries: ["West Bank"]
      })
    ).toBe("the West Bank");

    expect(
      buildModernLocationLabel({
        modernCountries: ["Golan Heights"]
      })
    ).toBe("the Golan Heights");
  });

  test("uses 'the' for West Bank in an 'and' list when it does not directly follow modern name", () => {
    expect(
      buildModernLocationLabel({
        modern: "Near Jericho",
        modernCountries: ["Jordan", "West Bank"]
      })
    ).toBe("Near Jericho, Jordan and the West Bank");
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
