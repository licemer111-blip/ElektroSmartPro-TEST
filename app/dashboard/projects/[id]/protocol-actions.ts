"use server";

import { createClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import type {
  MeasurementProtocol,
  MeasurementProtocolWithEntries,
  MeasurementEntry,
  InstallationType,
  SupplySystem,
  ProtocolResult,
  MeasurementType,
  MeasurementResult,
} from "@/lib/types/database";

// Get all protocols for a project
export async function getProjectProtocols(projectId: string): Promise<MeasurementProtocolWithEntries[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("measurement_protocols")
    .select("*, measurement_entries(*)")
    .eq("project_id", projectId)
    .order("protocol_date", { ascending: false });

  if (error) {
    logger.error("Error fetching protocols", { projectId }, error);
    return [];
  }

  return (data || []) as MeasurementProtocolWithEntries[];
}

// Create a new protocol
export async function createProtocol(projectId: string, data: {
  protocol_number?: string;
  protocol_date?: string;
  inspector_name?: string;
  inspector_qualifications?: string;
  installation_type?: InstallationType;
  supply_system?: SupplySystem;
  nominal_voltage?: number;
  instrument_name?: string;
  instrument_serial?: string;
  calibration_date?: string;
}) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  const { data: protocol, error } = await supabase
    .from("measurement_protocols")
    .insert({
      project_id: projectId,
      user_id: user.id,
      protocol_number: data.protocol_number || null,
      protocol_date: data.protocol_date || new Date().toISOString().split("T")[0],
      inspector_name: data.inspector_name || null,
      inspector_qualifications: data.inspector_qualifications || null,
      installation_type: data.installation_type || "new",
      supply_system: data.supply_system || "TN-S",
      nominal_voltage: data.nominal_voltage || 230,
      instrument_name: data.instrument_name || null,
      instrument_serial: data.instrument_serial || null,
      calibration_date: data.calibration_date || null,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating protocol", { projectId }, error);
    return { error: "Nie udało się utworzyć protokołu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { data: protocol as MeasurementProtocol };
}

// Update protocol metadata
export async function updateProtocol(protocolId: string, projectId: string, updates: Partial<{
  protocol_number: string;
  protocol_date: string;
  inspector_name: string;
  inspector_qualifications: string;
  installation_type: InstallationType;
  supply_system: SupplySystem;
  nominal_voltage: number;
  temperature: number;
  humidity: number;
  instrument_name: string;
  instrument_serial: string;
  calibration_date: string;
  overall_result: ProtocolResult;
  notes: string;
}>) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("measurement_protocols")
    .update(updates)
    .eq("id", protocolId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating protocol", { protocolId }, error);
    return { error: "Nie udało się zaktualizować protokołu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// Delete a protocol
export async function deleteProtocol(protocolId: string, projectId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("measurement_protocols")
    .delete()
    .eq("id", protocolId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting protocol", { protocolId }, error);
    return { error: "Nie udało się usunąć protokołu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// Add measurement entry to protocol
export async function addMeasurementEntry(protocolId: string, projectId: string, entry: {
  circuit_name: string;
  circuit_number?: string;
  location?: string;
  measurement_type: MeasurementType;
  measured_value?: number;
  unit?: string;
  required_value?: number;
  rcd_type?: string;
  rcd_current?: number;
  breaker_type?: string;
  breaker_rating?: number;
  result?: MeasurementResult;
  notes?: string;
}) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  // Auto-determine result based on measurement type and values
  let autoResult: MeasurementResult = "pass";
  if (entry.measured_value != null && entry.required_value != null) {
    switch (entry.measurement_type) {
      case "insulation_resistance":
        // Must be >= required (typically >= 1.0 MΩ)
        autoResult = entry.measured_value >= entry.required_value ? "pass" : "fail";
        break;
      case "loop_impedance":
        // Must be <= required
        autoResult = entry.measured_value <= entry.required_value ? "pass" : "fail";
        break;
      case "rcd_trip_time":
        // Must be <= required (typically <= 300ms or <= 40ms)
        autoResult = entry.measured_value <= entry.required_value ? "pass" : "fail";
        break;
      case "continuity":
        // Must be <= required (typically <= 1.0 Ω)
        autoResult = entry.measured_value <= entry.required_value ? "pass" : "fail";
        break;
      case "earth_resistance":
        // Must be <= required
        autoResult = entry.measured_value <= entry.required_value ? "pass" : "fail";
        break;
    }
  }

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from("measurement_entries")
    .select("sort_order")
    .eq("protocol_id", protocolId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from("measurement_entries")
    .insert({
      protocol_id: protocolId,
      circuit_name: entry.circuit_name,
      circuit_number: entry.circuit_number || null,
      location: entry.location || null,
      measurement_type: entry.measurement_type,
      measured_value: entry.measured_value ?? null,
      unit: entry.unit || getDefaultUnit(entry.measurement_type),
      required_value: entry.required_value ?? getDefaultRequired(entry.measurement_type),
      rcd_type: entry.rcd_type || null,
      rcd_current: entry.rcd_current ?? null,
      breaker_type: entry.breaker_type || null,
      breaker_rating: entry.breaker_rating ?? null,
      result: entry.result || autoResult,
      notes: entry.notes || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error adding measurement entry", { protocolId }, error);
    return { error: "Nie udało się dodać pomiaru" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { data: data as MeasurementEntry };
}

// Update measurement entry
export async function updateMeasurementEntry(
  entryId: string,
  projectId: string,
  updates: Partial<{
    circuit_name: string;
    circuit_number: string;
    location: string;
    measurement_type: MeasurementType;
    measured_value: number;
    unit: string;
    required_value: number;
    rcd_type: string;
    rcd_current: number;
    breaker_type: string;
    breaker_rating: number;
    result: MeasurementResult;
    notes: string;
  }>
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("measurement_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) {
    logger.error("Error updating measurement entry", { entryId }, error);
    return { error: "Nie udało się zaktualizować pomiaru" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// Delete measurement entry
export async function deleteMeasurementEntry(entryId: string, projectId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("measurement_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    logger.error("Error deleting measurement entry", { entryId }, error);
    return { error: "Nie udało się usunąć pomiaru" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// Helper: default unit by measurement type
function getDefaultUnit(type: MeasurementType): string {
  switch (type) {
    case "insulation_resistance": return "MΩ";
    case "loop_impedance": return "Ω";
    case "rcd_trip_time": return "ms";
    case "continuity": return "Ω";
    case "earth_resistance": return "Ω";
    default: return "";
  }
}

// Helper: default required value by measurement type
function getDefaultRequired(type: MeasurementType): number {
  switch (type) {
    case "insulation_resistance": return 1.0; // ≥ 1.0 MΩ for 230V
    case "loop_impedance": return 1.84; // Ω for B16A (230/0.4/312.5)
    case "rcd_trip_time": return 300; // ms for 30mA RCD
    case "continuity": return 1.0; // ≤ 1.0 Ω
    case "earth_resistance": return 30; // ≤ 30 Ω for TT
    default: return 0;
  }
}
