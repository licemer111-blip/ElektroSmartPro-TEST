export function detectBuildingType(assemblyName: string): string {
  const name = assemblyName.toLowerCase();

  if (
    name.includes("przemysł") || name.includes("przemysl") ||
    name.includes("hala") || name.includes("fabryka") ||
    name.includes("zakład") || name.includes("zaklad") ||
    name.includes("magazyn") || name.includes("produkcja") ||
    name.includes("industrial") || name.includes("400v") || name.includes("3-faz")
  ) return "Przemysł";

  if (
    name.includes("biuro") || name.includes("biura") ||
    name.includes("office") || name.includes("komercja") ||
    name.includes("komercj") || name.includes("sklep") ||
    name.includes("lokal") || name.includes("usług") ||
    name.includes("uslug") || name.includes("recepcja") ||
    name.includes("sala konferencyjna") || name.includes("open space")
  ) return "Biuro";

  return "Dom";
}

export function detectCategory(assemblyName: string): string {
  const name = assemblyName.toLowerCase();

  if (
    name.includes("oświetlen") || name.includes("oswietlen") ||
    name.includes("lampa") || name.includes("oprawa") ||
    name.includes("led") || name.includes("kinkiet") ||
    name.includes("sufit") || name.includes("lustra")
  ) return "Oświetlenie";

  if (
    name.includes("rozdziel") || name.includes("obwód") ||
    name.includes("obwod") || name.includes("rcd") ||
    name.includes("spd") || name.includes("s301") ||
    name.includes("s303") || name.includes("różnicówk") ||
    name.includes("roznicowk") || name.includes("ogranicznik")
  ) return "Rozdzielnice";

  if (
    name.includes("rj45") || name.includes("internet") ||
    name.includes("skrętk") || name.includes("skretk") ||
    name.includes("tv") || name.includes("sat") ||
    name.includes("multimedial") || name.includes("kamera") ||
    name.includes("monitoring") || name.includes("rejestrator") ||
    name.includes("alarm") || name.includes("czujka") ||
    name.includes("audio") || name.includes("koncentryk")
  ) return "Teletechnika";

  if (
    name.includes("smart") || name.includes("roleta") ||
    name.includes("rolety") || name.includes("wifi") ||
    name.includes("wi-fi") || name.includes("zigbee") ||
    name.includes("sterownik") || name.includes("automatyk")
  ) return "Smart Home";

  if (
    name.includes("zewnętrz") || name.includes("zewnetrz") ||
    name.includes("ogrod") || name.includes("brama") ||
    name.includes("furtka") || name.includes("wideodomofon") ||
    name.includes("ziemn") || name.includes("odgrom")
  ) return "Zewnętrzne";

  if (
    name.includes("gniazd") || name.includes("gniazo") ||
    name.includes("włącznik") || name.includes("wlacznik") ||
    name.includes("łącznik") || name.includes("lacznik") ||
    name.includes("płyta indukcyjna") || name.includes("plyta indukcyjna") ||
    name.includes("zmywark") || name.includes("pralk") ||
    name.includes("piekarnik") || name.includes("mikrofa") ||
    name.includes("agd") || name.includes("zasilanie") ||
    name.includes("przyłącze") || name.includes("przylacze") ||
    name.includes("punkt") || name.includes("łazienk") ||
    name.includes("lazienk") || name.includes("wentylator") ||
    name.includes("grzejnik") || name.includes("termostat") ||
    name.includes("ogrzewanie") || name.includes("falownik") ||
    name.includes("fotowoltaik") || name.includes("pv") ||
    name.includes("garaż") || name.includes("garaz") ||
    name.includes("warsztat")
  ) return "Instalacje";

  return "Instalacje";
}
