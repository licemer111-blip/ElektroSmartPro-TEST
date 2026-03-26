import { describe, it, expect } from "vitest";
import { getUnitBaseSize, scaleLaborNorm } from "../lib/labor-time";

describe("getUnitBaseSize", () => {
  it("returns 1 for base units", () => {
    expect(getUnitBaseSize("m")).toBe(1);
    expect(getUnitBaseSize("mb")).toBe(1);
    expect(getUnitBaseSize("szt")).toBe(1);
    expect(getUnitBaseSize("kpl")).toBe(1);
    expect(getUnitBaseSize("h")).toBe(1);
    expect(getUnitBaseSize("m2")).toBe(1);
    expect(getUnitBaseSize("godz")).toBe(1);
  });

  it("returns 100 for 100m / 100mb / 100szt variants", () => {
    expect(getUnitBaseSize("100m")).toBe(100);
    expect(getUnitBaseSize("100mb")).toBe(100);
    expect(getUnitBaseSize("100 mb")).toBe(100);
    expect(getUnitBaseSize("100szt")).toBe(100);
    expect(getUnitBaseSize("100 szt")).toBe(100);
  });

  it("returns 10 for 10mb / 10szt variants", () => {
    expect(getUnitBaseSize("10mb")).toBe(10);
    expect(getUnitBaseSize("10m")).toBe(10);
    expect(getUnitBaseSize("10szt")).toBe(10);
    expect(getUnitBaseSize("10 szt")).toBe(10);
  });

  it("returns 1000 for km", () => {
    expect(getUnitBaseSize("km")).toBe(1000);
    expect(getUnitBaseSize("KM")).toBe(1000);
  });

  it("returns 1 for null / undefined / empty", () => {
    expect(getUnitBaseSize(null)).toBe(1);
    expect(getUnitBaseSize(undefined)).toBe(1);
    expect(getUnitBaseSize("")).toBe(1);
  });

  it("returns 1 for unknown units", () => {
    expect(getUnitBaseSize("kWp")).toBe(1);
    expect(getUnitBaseSize("para")).toBe(1);
    expect(getUnitBaseSize("pkt")).toBe(1);
  });
});

describe("scaleLaborNorm", () => {
  it("no-op when dict unit == item unit (mb/mb)", () => {
    expect(scaleLaborNorm(0.025, "mb", "mb")).toBeCloseTo(0.025);
  });

  it("scales 100mb dict norm down for item in mb (÷100)", () => {
    // KNR: 4.9 rbh per 100mb → 0.049 rbh per mb
    expect(scaleLaborNorm(4.9, "100mb", "mb")).toBeCloseTo(0.049);
  });

  it("scales 10mb dict norm down for item in mb (÷10)", () => {
    // KNR: 1.6 rbh per 10mb → 0.16 rbh per mb
    expect(scaleLaborNorm(1.6, "10mb", "mb")).toBeCloseTo(0.16);
  });

  it("scales mb dict norm up for item in km (×1000)", () => {
    // KNR: 0.025 rbh per mb → 25 rbh per km
    expect(scaleLaborNorm(0.025, "mb", "km")).toBeCloseTo(25);
  });

  it("combines: 100mb dict, item in km (×1000/100 = ×10)", () => {
    // KNR: 4.9 rbh per 100mb → 49 rbh per km
    expect(scaleLaborNorm(4.9, "100mb", "km")).toBeCloseTo(49);
  });

  it("szt dict norm unchanged for szt item", () => {
    expect(scaleLaborNorm(1.5, "szt", "szt")).toBeCloseTo(1.5);
  });

  it("100szt dict norm for szt item (÷100)", () => {
    expect(scaleLaborNorm(150, "100szt", "szt")).toBeCloseTo(1.5);
  });

  it("handles null-like units (fallback to 1)", () => {
    expect(scaleLaborNorm(2.0, null, null)).toBeCloseTo(2.0);
    expect(scaleLaborNorm(2.0, undefined, undefined)).toBeCloseTo(2.0);
    expect(scaleLaborNorm(2.0, "", "mb")).toBeCloseTo(2.0);
  });

  it("no floating point explosion for real KNR data", () => {
    // avg norm for 100mb entries in DB: 4.9161
    const result = scaleLaborNorm(4.9161, "100mb", "mb");
    expect(result).toBeCloseTo(0.049161);
    // should not have more than 6 decimal places
    expect(result.toString().replace(".", "").length).toBeLessThanOrEqual(12);
  });
});
