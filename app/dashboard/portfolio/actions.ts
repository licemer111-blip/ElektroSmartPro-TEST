"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { PortfolioItem, PortfolioCategory } from "@/lib/types/database";

export async function getPortfolioItems(): Promise<{ items: PortfolioItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "Nie jesteś zalogowany" };

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) return { items: [], error: error.message };
  return { items: (data || []) as PortfolioItem[] };
}

export async function getPublicPortfolioItems(userId: string, limit?: number): Promise<PortfolioItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data } = await query;
  return (data || []) as PortfolioItem[];
}

interface CreatePortfolioInput {
  title: string;
  description?: string;
  location?: string;
  completion_date?: string;
  category: PortfolioCategory;
  images: string[];
  is_public?: boolean;
}

export async function createPortfolioItem(input: CreatePortfolioInput): Promise<{ item?: PortfolioItem; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  // Get max sort_order
  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0;

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      completion_date: input.completion_date || null,
      category: input.category,
      images: input.images,
      is_public: input.is_public ?? true,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/portfolio");
  return { item: data as PortfolioItem };
}

interface UpdatePortfolioInput {
  id: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  completion_date?: string | null;
  category?: PortfolioCategory;
  images?: string[];
  is_public?: boolean;
  sort_order?: number;
}

export async function updatePortfolioItem(input: UpdatePortfolioInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.completion_date !== undefined) updateData.completion_date = input.completion_date;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.images !== undefined) updateData.images = input.images;
  if (input.is_public !== undefined) updateData.is_public = input.is_public;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { error } = await supabase
    .from("portfolio_items")
    .update(updateData)
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/portfolio");
  return {};
}

export async function deletePortfolioItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  // Get item to find images to delete
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("images")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (item && item.images && item.images.length > 0) {
    const paths = item.images.map((url: string) => {
      const parts = url.split("/portfolio/");
      return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from("portfolio").remove(paths);
    }
  }

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/portfolio");
  return {};
}

export async function uploadPortfolioImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Brak pliku" };

  if (file.size > 5 * 1024 * 1024) return { error: "Plik jest za duży (maks. 5MB)" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("portfolio")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(fileName);
  return { url: urlData.publicUrl };
}

export async function deletePortfolioImage(url: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  const parts = url.split("/portfolio/");
  if (parts.length < 2) return { error: "Nieprawidłowy URL" };

  const path = parts[1];
  if (!path.startsWith(user.id)) return { error: "Brak dostępu" };

  const { error } = await supabase.storage.from("portfolio").remove([path]);
  if (error) return { error: error.message };
  return {};
}

export async function reorderPortfolioItems(orderedIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("portfolio_items")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r: { error: { message: string } | null }) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/dashboard/portfolio");
  return {};
}

export async function togglePortfolioVisibility(visible: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nie jesteś zalogowany" };

  const { error } = await supabase
    .from("profiles")
    .update({ portfolio_visible: visible })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/portfolio");
  return {};
}
