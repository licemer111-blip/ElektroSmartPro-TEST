/**
 * DIN Modules Catalog
 * Static data lives in lib/data/json/din-modules.json
 * This file re-exports typed constants with React icon hydration.
 *
 * ICON STRATEGY: JSON stores iconName (string), this wrapper maps to Lucide components.
 */

import type { ElementType } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ElementType<any>;
import {
  Zap, Shield, ToggleLeft, Gauge, CircleDot, Timer,
  Cable, Activity, Cog, Power, Battery, Lightbulb,
  Package, Scissors, Ruler, Antenna, Box, Plug, Hammer,
  PaintBucket, Cpu, CircleAlert, FileText, Fan, Flame,
  Sun, Radio, Home, Factory, Store, Building2,
} from "lucide-react";
import type {
  DinModule,
  Manufacturer,
  PanelTemplate,
} from "@/components/project/panel-configurator-types";
import rawData from "./json/din-modules.json";

// ─── Icon name → Lucide component mapping ─────────────────────────────────
const ICON_MAP: Record<string, IconComponent> = {
  Zap, Shield, ToggleLeft, Gauge, CircleDot, Timer,
  Cable, Activity, Cog, Power, Battery, Lightbulb,
  Package, Scissors, Ruler, Antenna, Box, Plug, Hammer,
  PaintBucket, Cpu, CircleAlert, FileText, Fan, Flame,
  Sun, Radio, Home, Factory, Store, Building2,
};

function resolveIcon(iconName: string | undefined): IconComponent {
  return (iconName && ICON_MAP[iconName]) ? ICON_MAP[iconName] : Zap;
}

// ─── Exported typed constants ─────────────────────────────────────────────

export const MANUFACTURERS: Manufacturer[] = rawData.MANUFACTURERS as Manufacturer[];

export const DIN_MODULES: DinModule[] = (rawData.DIN_MODULES as Array<Record<string, unknown>>).map(m => ({
  ...m,
  icon: resolveIcon(m.iconName as string),
})) as DinModule[];

export const ENCLOSURE_OPTIONS = rawData.ENCLOSURE_OPTIONS as Array<{
  name: string;
  modules: number;
  rows: number;
  price: number;
  laborPrice: number;
}>;

export const PANEL_TEMPLATES: PanelTemplate[] = (rawData.PANEL_TEMPLATES as Array<Record<string, unknown>>).map(t => ({
  ...t,
  icon: resolveIcon(t.iconName as string),
})) as PanelTemplate[];

interface CalculatorLink {
  id: string;
  title: string;
  description: string;
  iconName: string;
  icon: IconComponent;
  gradient: string;
  href: string;
  features: string[];
}

export const CALCULATOR_LINKS: CalculatorLink[] = (rawData.CALCULATOR_LINKS as Array<Record<string, unknown>>).map(c => ({
  id: c.id as string,
  title: c.title as string,
  description: c.description as string,
  iconName: c.iconName as string,
  icon: resolveIcon(c.iconName as string),
  gradient: c.gradient as string,
  href: c.href as string,
  features: c.features as string[],
}));

export const CABLE_TYPES = rawData.CABLE_TYPES as string[];
