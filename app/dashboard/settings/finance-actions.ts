"use server";

import { logger } from "@/lib/logger";
import { tryAuth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

/**
 * Check if the current user is an admin
 * Checks both email (hardcoded) and role in database
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return false;
    }

    // Check hardcoded admin email
    if (user.email === ADMIN_EMAIL) {
      return true;
    }

    // Also check role in database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error checking admin status:", {}, error);
    return false;
  }
}

/**
 * Get all users with their subscription status (Admin only)
 * Uses RPC function to join with auth.users for email addresses
 */
export async function getAllUsers() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const supabase = await createClient();
    
    // Call RPC function that returns profiles with emails
    const { data: profiles, error } = await supabase
      .rpc("get_users_with_email");

    if (error) throw error;

    return { success: true, data: profiles };
  } catch (error) {
    logger.error("Error fetching users:", {}, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Błąd pobierania użytkowników" 
    };
  }
}

/**
 * Get all payments from the database (Admin only)
 */
export async function getPayments() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const supabase = await createClient();
    
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: payments };
  } catch (error) {
    logger.error("Error fetching payments:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Błąd pobierania płatności",
    };
  }
}

/**
 * Get subscription statistics (Admin only)
 */
export async function getSubscriptionStats() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const supabase = await createClient();
    
    // Get total users
    const { count: totalUsers, error: totalError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // Get PRO users
    const { count: proUsers, error: proError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_pro", true);

    if (proError) throw proError;

    // Get free users
    const freeUsers = (totalUsers || 0) - (proUsers || 0);

    // Calculate REAL monthly revenue from payments table
    // Get payments from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount_total")
      .eq("status", "succeeded")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (paymentsError) throw paymentsError;

    // Sum up total revenue (convert from grosze to PLN)
    const monthlyRevenue = recentPayments
      ? Math.round(recentPayments.reduce((sum, payment) => sum + payment.amount_total, 0) / 100)
      : 0;

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        freeUsers,
        monthlyRevenue,
      },
    };
  } catch (error) {
    logger.error("Error fetching subscription stats:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Błąd pobierania statystyk",
    };
  }
}

/**
 * Toggle PRO status for a user (Admin only)
 * Uses admin client to bypass RLS
 */
export async function toggleUserProStatus(userId: string, currentStatus: boolean) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Use admin client to bypass RLS policies
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        is_pro: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      logger.error("Supabase error toggling PRO status:", {}, error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    logger.error("Error toggling PRO status:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Błąd zmiany statusu PRO",
    };
  }
}

/**
 * Toggle Admin role for a user (Admin only)
 * Uses admin client to bypass RLS
 */
export async function toggleUserAdminRole(userId: string, currentRole: string) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Toggle between 'admin' and 'user'
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    // Use admin client to bypass RLS policies
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      logger.error("Supabase error toggling admin role:", {}, error);
      throw error;
    }

    return { success: true, newRole };
  } catch (error) {
    logger.error("Error toggling admin role:", {}, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Błąd zmiany roli administratora",
    };
  }
}
