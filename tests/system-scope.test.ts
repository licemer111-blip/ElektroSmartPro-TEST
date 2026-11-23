import { describe, expect, it } from "vitest";
import { findCanonicalL0 } from "@/lib/services/canonical-knr-l0";
import { wholeSystem } from "@/lib/estimate/system-scope";

describe("whole system versus one device", () => {
  it("leaves a socket point alone", () => {
    expect(wholeSystem("Punkt gniazda podtynkowego")).toBeNull();
    expect(wholeSystem("Gniazdo komplet")).toBeNull();
    expect(wholeSystem("Demontaż gniazda")).toBeNull();
  });

  it("does not price a smoke system as one panel", () => {
    expect(wholeSystem("Oddymianie (komplet)")?.id).toBe("smoke");
    expect(wholeSystem("Centrala oddymiania")).toBeNull();
    expect(wholeSystem("Przycisk oddymiania")).toBeNull();
  });

  it("catches the other whole-building names", () => {
    expect(wholeSystem("Fotowoltaika komplet")?.id).toBe("pv");
    expect(wholeSystem("Panel fotowoltaiczny")).toBeNull();
    expect(wholeSystem("Monitoring obiektu")?.id).toBe("cctv");
    expect(wholeSystem("Kamera IP kopułowa")).toBeNull();
    expect(wholeSystem("Domofon")?.id).toBe("door");
    expect(wholeSystem("Unifon")).toBeNull();
    expect(wholeSystem("Oświetlenie awaryjne")?.id).toBe("emergency");
    expect(wholeSystem("Oprawa awaryjna LED")).toBeNull();
    expect(wholeSystem("Rozdzielnica komplet")?.id).toBe("board");
    expect(wholeSystem("WLZ")?.id).toBe("wlz");
    expect(wholeSystem("WLZ YKY 5x16")).toBeNull();
    expect(wholeSystem("Wallbox 11 kW")?.id).toBe("ev");
    expect(wholeSystem("System KNX")?.id).toBe("knx");
    expect(wholeSystem("Czujnik KNX")).toBeNull();
    expect(wholeSystem("Pomiary odbiorcze")?.id).toBe("tests");
    expect(wholeSystem("Pomiary odbiorcze instalacji elektrycznej")?.id).toBe("tests");
    expect(wholeSystem("Pomiar rezystancji izolacji")).toBeNull();
    expect(wholeSystem("Instalacja odgromowa")?.id).toBe("lightning");
    expect(wholeSystem("Zwód poziomy")).toBeNull();
    expect(wholeSystem("Demontaż instalacji mieszkania")?.id).toBe("demo");
  });

  it("offers device hours that match the locked norm", () => {
    const pv = wholeSystem("Fotowoltaika");
    const panel = pv?.devices.find((device) => device.id === "panel");
    const hit = findCanonicalL0("Panel fotowoltaiczny", "szt");
    expect(panel?.hours).toBe(hit?.laborNorm);
  });
});
