// Quick L0 Canonical debug: verify findCanonicalL0 matches bruzdowanie cases at runtime
import { findCanonicalL0 } from "../lib/services/canonical-knr-l0.ts";

const cases = [
  ["Bruzdowanie w cegle (1 przewód)", "mb"],
  ["Bruzdowanie w betonie", "mb"],
  ["Wykucie otworu pod puszkę Ø60 w cegle", "szt"],
  ["Zaprawianie bruzd po ułożeniu przewodów", "mb"],
  ["Przewód YDYp 3x1,5 mm²", "mb"],
];

for (const [n, u] of cases) {
  const r = findCanonicalL0(n, u);
  console.log(`${n.padEnd(48)} | ${u.padEnd(4)} => ${r ? r.knrCode + " / " + r.laborNorm + " rbh/" + r.unit : "NULL"}`);
}
