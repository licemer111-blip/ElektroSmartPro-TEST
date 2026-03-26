/**
 * Admin Utilities
 * Helper functions for admin role checks and access control
 */

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch (error) {
    logger.error("Error checking admin status:", {}, error);
    return false;
  }
}

/**
 * Check if the current user is an admin and throw error if not
 * Use this in Server Actions to protect admin-only operations
 * @throws {Error} if user is not admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * Get admin status along with user info
 * Useful for UI rendering decisions
 */
export async function getAdminStatus(): Promise<{
  isAdmin: boolean;
  userId: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, userId: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      isAdmin: profile?.role === "admin",
      userId: user.id,
    };
  } catch (error) {
    logger.error("Error getting admin status:", {}, error);
    return { isAdmin: false, userId: null };
  }
}

/**
 * Check if the current user has PRO status
 * Uses admin client to bypass RLS and get fresh data from database
 * This ensures changes made in Supabase Table Editor are reflected immediately
 * @returns {Promise<boolean>} true if user has PRO status
 */
export async function isPro(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Use admin client to bypass RLS and get fresh data
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("Error checking PRO status:", {}, error);
      return false;
    }

    return profile?.is_pro === true;
  } catch (error) {
    logger.error("Error checking PRO status:", {}, error);
    return false;
  }
}

/**
 * Check if user has PRO status and throw error if not
 * Uses admin client to get fresh data from database
 * @throws {Error} if user is not PRO
 */
export async function requirePro(): Promise<void> {
  const hasProStatus = await isPro();
  
  if (!hasProStatus) {
    throw new Error("Unauthorized: PRO subscription required");
  }
}

/**
 * Check if user has either Admin OR PRO access
 * Useful for features that should be available to both admins and PRO users
 * @returns {Promise<boolean>} true if user is admin or has PRO status
 */
export async function isAdminOrPro(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Use admin client to get fresh data
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_pro, role")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("Error checking admin/PRO status:", {}, error);
      return false;
    }

    return profile?.role === "admin" || profile?.is_pro === true;
  } catch (error) {
    logger.error("Error checking admin/PRO status:", {}, error);
    return false;
  }
}

/**
 * Get full user access status (admin, PRO, userId) using admin client
 * Ensures fresh data from database
 */
export async function getUserAccessStatus(): Promise<{
  isAdmin: boolean;
  isPro: boolean;
  userId: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, isPro: false, userId: null };
    }

    // Use admin client to get fresh data
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_pro, role")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("Error getting user access status:", {}, error);
      return { isAdmin: false, isPro: false, userId: user.id };
    }

    return {
      isAdmin: profile?.role === "admin",
      isPro: profile?.is_pro === true,
      userId: user.id,
    };
  } catch (error) {
    logger.error("Error getting user access status:", {}, error);
    return { isAdmin: false, isPro: false, userId: null };
  }
}
