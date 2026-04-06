"use server";

import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Client, ClientType, ClientSource } from "@/lib/types/database";
import { logger } from "@/lib/logger";

// =====================================================
// GET CLIENTS
// =====================================================

export async function getClients(): Promise<Client[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching clients", {}, error);
    return [];
  }

  return data || [];
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    logger.error("Error fetching client", { clientId }, error);
    return null;
  }

  return data;
}

export async function getClientWithProjects(clientId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  // Get client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) return null;

  // Get projects for this client
  const { data: projects } = await supabase
    .from("projects")
    .select("*, regions(*), object_types(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return {
    ...client,
    projects: projects || []
  };
}

// =====================================================
// CREATE CLIENT
// =====================================================

interface CreateClientInput {
  name: string;
  company_name?: string;
  type?: ClientType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  nip?: string;
  regon?: string;
  tags?: string[];
  notes?: string;
  source?: ClientSource;
  team_id?: string;
}

export async function createClient(input: CreateClientInput): Promise<{ client?: Client; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: input.name,
      company_name: input.company_name || null,
      type: input.type || "individual",
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      postal_code: input.postal_code || null,
      nip: input.nip || null,
      regon: input.regon || null,
      tags: input.tags || [],
      notes: input.notes || null,
      source: input.source || null,
      team_id: input.team_id || null,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating client", { clientName: input.name }, error);
    return { error: "Błąd podczas tworzenia klienta" };
  }

  revalidatePath("/dashboard/clients");
  return { client: data };
}

// =====================================================
// UPDATE CLIENT
// =====================================================

export async function updateClient(
  clientId: string,
  input: Partial<CreateClientInput>
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating client", { clientId }, error);
    return { error: "Błąd podczas aktualizacji klienta" };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// =====================================================
// DELETE CLIENT
// =====================================================

export async function deleteClient(clientId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting client", { clientId }, error);
    return { error: "Błąd podczas usuwania klienta" };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// =====================================================
// SEARCH CLIENTS
// =====================================================

export async function searchClients(query: string): Promise<Client[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .or(`name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%,nip.ilike.%${query}%`)
    .order("name", { ascending: true })
    .limit(20);

  if (error) {
    logger.error("Error searching clients", { query }, error);
    return [];
  }

  return data || [];
}

// =====================================================
// GET CLIENTS FOR SELECT (lightweight)
// =====================================================

export async function getClientsForSelect(): Promise<{ id: string; name: string; company_name: string | null }[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, company_name")
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching clients for select", {}, error);
    return [];
  }

  return data || [];
}

// =====================================================
// ASSIGN CLIENT TO PROJECT
// =====================================================

export async function assignClientToProject(
  projectId: string,
  clientId: string | null
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ client_id: clientId })
    .eq("id", projectId);

  if (error) {
    logger.error("Error assigning client to project", { projectId, clientId }, error);
    return { error: "Błąd podczas przypisywania klienta" };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// =====================================================
// ADD/REMOVE CLIENT TAGS
// =====================================================

export async function updateClientTags(
  clientId: string,
  tags: string[]
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("clients")
    .update({ tags })
    .eq("id", clientId);

  if (error) {
    logger.error("Error updating client tags", { clientId }, error);
    return { error: "Błąd podczas aktualizacji tagów" };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// =====================================================
// GET CLIENT STATS
// =====================================================

export async function getClientStats() {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  const { data: clients } = await supabase
    .from("clients")
    .select("total_projects, total_revenue, tags");

  if (!clients) return null;

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
  const totalProjects = clients.reduce((sum, c) => sum + (c.total_projects || 0), 0);
  
  // Count tags
  const tagCounts: Record<string, number> = {};
  clients.forEach(c => {
    (c.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return {
    totalClients,
    totalRevenue,
    totalProjects,
    tagCounts,
    avgRevenuePerClient: totalClients > 0 ? totalRevenue / totalClients : 0,
  };
}
