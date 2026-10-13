import { formatHolderYearRange } from "../src/features/map/holder-year-range";

describe("holder year range formatting", () => {
  test("formats Philip in AD 30", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -4,
        heldToYear: 34,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("4 BC – AD 34");
  });

  test("formats Agrippa I in Philip's former lands", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: 37,
        heldToYear: 44,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("AD 37 – 44");
  });

  test("formats Archelaus", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -4,
        heldToYear: 6,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("4 BC – AD 6");
  });

  test("formats Antipas", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -4,
        heldToYear: 39,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("4 BC – AD 39");
  });

  test("formats Commagene kingdom", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -20,
        heldToYear: 17,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("20 BC – AD 17");
  });

  test("formats Lycian League with unknown start", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -4,
        heldToYear: 43,
        heldFromKnown: false,
        timelineRangeEndYear: 101
      })
    ).toBe("until AD 43");
  });

  test("formats Thrace kingdom with unknown start", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: -4,
        heldToYear: 46,
        heldFromKnown: false,
        timelineRangeEndYear: 101
      })
    ).toBe("until AD 46");
  });

  test("formats Lycia and Pamphylia at timeline end", () => {
    expect(
      formatHolderYearRange({
        heldFromYear: 74,
        heldToYear: 101,
        heldFromKnown: true,
        timelineRangeEndYear: 101
      })
    ).toBe("from AD 74");
  });
});
