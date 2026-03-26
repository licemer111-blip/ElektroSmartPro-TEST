/**
 * Script: extract-json-data.js
 * Extracts static data from TS files into JSON for lib/data/json/
 * Run: node scripts/extract-json-data.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JSON_DIR = path.join(ROOT, "lib", "data", "json");
fs.mkdirSync(JSON_DIR, { recursive: true });

// ─── 1. market-data.ts → market-data.json ─────────────────────────────────
function extractMarketData() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "data", "market-data.ts"), "utf8");

  // REGIONAL_MODIFIERS
  const regBlock = src.match(/export const REGIONAL_MODIFIERS[^=]+=\s*\{([^}]+)\}/)[1];
  const regional = {};
  for (const line of regBlock.split("\n")) {
    const m = line.match(/["']?([\w-]+)["']?\s*:\s*([\d.]+)/);
    if (m) regional[m[1]] = parseFloat(m[2]);
  }

  // MARKET_DATA — parse each object block
  const items = [];
  const itemRx = /\{\s*id:\s*["'](\d+)["'][^}]+\}/gs;
  let match;
  while ((match = itemRx.exec(src)) !== null) {
    const block = match[0];
    const get = (key) => { const m = block.match(new RegExp(key + `:\\s*["']?([^,"'\\n}]+?)["']?[,\\s}]`)); return m ? m[1].trim() : null; };
    const getNum = (key) => { const m = block.match(new RegExp(key + `:\\s*(-?[\\d.]+)`)); return m ? parseFloat(m[1]) : null; };
    items.push({
      id: get("id"),
      name: get("name"),
      category: get("category"),
      basePrice: getNum("basePrice"),
      unit: get("unit"),
      trend: get("trend"),
      trendPercent: getNum("trendPercent"),
    });
  }

  const out = { REGIONAL_MODIFIERS: regional, MARKET_DATA: items };
  fs.writeFileSync(path.join(JSON_DIR, "market-data.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(`market-data.json: ${items.length} items, ${Object.keys(regional).length} regions`);
}

// ─── 2. din-modules-catalog.ts → din-modules.json ─────────────────────────
// DinModule.icon is a React component — store iconName string instead.
function extractDinModules() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "data", "din-modules-catalog.ts"), "utf8");

  // MANUFACTURERS
  const mfBlock = src.match(/export const MANUFACTURERS[^=]+=\s*\[([^;]+?)\];/s)[1];
  const manufacturers = [];
  const mfRx = /\{([^}]+)\}/gs;
  let m;
  while ((m = mfRx.exec(mfBlock)) !== null) {
    const b = m[1];
    const g = (k) => { const r = b.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : ""; };
    const gn = (k) => { const r = b.match(new RegExp(k + `:\\s*([\\d.]+)`)); return r ? parseFloat(r[1]) : 1.0; };
    manufacturers.push({ id: g("id"), name: g("name"), country: g("country"), coefficient: gn("coefficient"), description: g("description") });
  }

  // DIN_MODULES — extract each object, replace icon: Xyz with iconName: "Xyz"
  // Split by top-level { } blocks inside the DIN_MODULES array
  const dinStart = src.indexOf("export const DIN_MODULES: DinModule[] = [") + "export const DIN_MODULES: DinModule[] = [".length;
  // Find the matching ]
  let depth = 0, dinEnd = dinStart;
  for (let i = dinStart - 1; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) { dinEnd = i; break; } }
  }
  const dinBody = src.slice(dinStart, dinEnd);

  const modules = [];
  // Parse each { ... } object block at depth 1
  let pos2 = 0;
  while (pos2 < dinBody.length) {
    const start = dinBody.indexOf("{", pos2);
    if (start === -1) break;
    let d = 0, end = start;
    for (let i = start; i < dinBody.length; i++) {
      if (dinBody[i] === "{") d++;
      else if (dinBody[i] === "}") { d--; if (d === 0) { end = i + 1; break; } }
    }
    const block = dinBody.slice(start, end);
    pos2 = end;

    const gs = (k) => { const r = block.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
    const gn = (k) => { const r = block.match(new RegExp(k + `:\\s*(-?[\\d.]+)(?:[^.]|$)`)); return r ? parseFloat(r[1]) : null; };
    const iconMatch = block.match(/icon:\s*(\w+)/);
    const iconName = iconMatch ? iconMatch[1] : "Zap";

    // ratingOptions
    const roMatch = block.match(/ratingOptions:\s*\[([^\]]+)\]/);
    const ratingOptions = roMatch ? roMatch[1].split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : undefined;

    const mod = {
      id: gs("id"),
      name: gs("name"),
      namePl: gs("namePl"),
      category: gs("category"),
      modules: gn("modules") ?? 1,
      iconName,
      defaultRating: gn("defaultRating") ?? undefined,
      defaultPrice: gn("defaultPrice") ?? 0,
      defaultLaborPrice: gn("defaultLaborPrice") ?? 0,
      description: gs("description") ?? undefined,
    };
    if (ratingOptions && ratingOptions.length > 0) mod.ratingOptions = ratingOptions;
    if (mod.id) modules.push(mod);
  }

  // CABLE_TYPES — simple string array
  const ctMatch = src.match(/export const CABLE_TYPES\s*=\s*\[([^\]]+)\]/s);
  const cableTypes = ctMatch
    ? ctMatch[1].split("\n").map(l => l.match(/["']([^"']+)["']/)).filter(Boolean).map(m => m[1])
    : [];

  // ENCLOSURE_OPTIONS (no id field — use name as key)
  function extractBlockArray(srcStr, exportName) {
    const marker = `export const ${exportName}`;
    const start = srcStr.indexOf(marker) + marker.length;
    const bodyStart = srcStr.indexOf("[", start);
    let depth = 0, end = bodyStart;
    for (let i = bodyStart; i < srcStr.length; i++) {
      if (srcStr[i] === "[") depth++;
      else if (srcStr[i] === "]") { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    return srcStr.slice(bodyStart + 1, end - 1);
  }

  function parseObjectBlocks(body) {
    const results = [];
    let p = 0;
    while (p < body.length) {
      const s = body.indexOf("{", p);
      if (s === -1) break;
      let d = 0, e = s;
      for (let i = s; i < body.length; i++) {
        if (body[i] === "{") d++;
        else if (body[i] === "}") { d--; if (d === 0) { e = i + 1; break; } }
      }
      results.push(body.slice(s, e));
      p = e;
    }
    return results;
  }

  const eoBody = extractBlockArray(src, "ENCLOSURE_OPTIONS");
  const enclosures = parseObjectBlocks(eoBody).map(b => {
    const gs = (k) => { const r = b.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
    const gn = (k) => { const r = b.match(new RegExp(k + `:\\s*(-?[\\d.]+)`)); return r ? parseFloat(r[1]) : null; };
    return { name: gs("name"), modules: gn("modules"), rows: gn("rows"), price: gn("price"), laborPrice: gn("laborPrice") };
  }).filter(e => e.name);

  // PANEL_TEMPLATES (icon → iconName string)
  const ptBody = extractBlockArray(src, "PANEL_TEMPLATES");
  const templates = parseObjectBlocks(ptBody).map(b => {
    const gs = (k) => { const r = b.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
    const gn = (k) => { const r = b.match(new RegExp(k + `:\\s*(-?[\\d.]+)`)); return r ? parseFloat(r[1]) : null; };
    const iconMatch = b.match(/^\s*icon:\s*(\w+)/m);
    // Extract railModules sub-array
    const rmStart = b.indexOf("railModules:");
    let railModules = [];
    if (rmStart !== -1) {
      const arrStart = b.indexOf("[", rmStart);
      let d2 = 0, arrEnd = arrStart;
      for (let i = arrStart; i < b.length; i++) {
        if (b[i] === "[") d2++;
        else if (b[i] === "]") { d2--; if (d2 === 0) { arrEnd = i + 1; break; } }
      }
      const rmBody = b.slice(arrStart + 1, arrEnd - 1);
      railModules = parseObjectBlocks(rmBody).map(rb => {
        const rgs = (k) => { const r = rb.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
        const rgn = (k) => { const r = rb.match(new RegExp(k + `:\\s*(-?[\\d.]+)`)); return r ? parseFloat(r[1]) : null; };
        const rm = { moduleId: rgs("moduleId") };
        const rating = rgn("rating"); if (rating !== null) rm.rating = rating;
        const label = rgs("label"); if (label) rm.label = label;
        const knrCode = rgs("knrCode"); if (knrCode) rm.knrCode = knrCode;
        const laborRate = rgn("laborRate"); if (laborRate !== null) rm.laborRate = laborRate;
        const phase = rgs("phase"); if (phase) rm.phase = phase;
        return rm;
      }).filter(r => r.moduleId);
    }
    // Extract accessories sub-array
    const accStart = b.indexOf("accessories:");
    let accessories = [];
    if (accStart !== -1) {
      const arrStart = b.indexOf("[", accStart);
      let d2 = 0, arrEnd = arrStart;
      for (let i = arrStart; i < b.length; i++) {
        if (b[i] === "[") d2++;
        else if (b[i] === "]") { d2--; if (d2 === 0) { arrEnd = i + 1; break; } }
      }
      const accBody = b.slice(arrStart + 1, arrEnd - 1);
      accessories = parseObjectBlocks(accBody).map(ab => {
        const ags = (k) => { const r = ab.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
        const agn = (k) => { const r = ab.match(new RegExp(k + `:\\s*(-?[\\d.]+)`)); return r ? parseFloat(r[1]) : null; };
        return { moduleId: ags("moduleId"), quantity: agn("quantity") ?? 1 };
      }).filter(a => a.moduleId);
    }
    return {
      id: gs("id"), name: gs("name"),
      iconName: iconMatch ? iconMatch[1] : "Home",
      description: gs("description"),
      enclosureModules: gn("enclosureModules"),
      railModules, accessories,
    };
  }).filter(t => t.id);

  // CALCULATOR_LINKS (icon → iconName string)
  const clBody = extractBlockArray(src, "CALCULATOR_LINKS");
  const calculatorLinks = parseObjectBlocks(clBody).map(b => {
    const gs = (k) => { const r = b.match(new RegExp(k + `:\\s*["']([^"']+)["']`)); return r ? r[1] : null; };
    const iconMatch = b.match(/icon:\s*(\w+)/);
    // features array
    const featMatch = b.match(/features:\s*\[([^\]]+)\]/);
    const features = featMatch
      ? featMatch[1].split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
      : [];
    return {
      id: gs("id"), title: gs("title"), description: gs("description"),
      iconName: iconMatch ? iconMatch[1] : "Zap",
      gradient: gs("gradient"), href: gs("href"), features,
    };
  }).filter(c => c.id);

  const out = {
    MANUFACTURERS: manufacturers,
    DIN_MODULES: modules,
    ENCLOSURE_OPTIONS: enclosures,
    PANEL_TEMPLATES: templates,
    CALCULATOR_LINKS: calculatorLinks,
    CABLE_TYPES: cableTypes,
  };
  fs.writeFileSync(path.join(JSON_DIR, "din-modules.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(`din-modules.json: ${modules.length} modules, ${enclosures.length} enclosures, ${manufacturers.length} manufacturers`);
}

extractMarketData();
extractDinModules();
console.log("All done.");
