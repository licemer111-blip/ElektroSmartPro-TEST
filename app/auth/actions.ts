"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Type-safe data extraction
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validation
  if (!data.email || !data.password) {
    return { error: "Email i hasło są wymagane" };
  }

  // Attempt to sign in
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return user-friendly Polish error messages
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Nieprawidłowy email lub hasło" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Potwierdź swój email przed zalogowaniem" };
    }
    return { error: "Błąd logowania. Spróbuj ponownie." };
  }

  // Revalidate and redirect on success
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Type-safe data extraction
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validation
  if (!data.email || !data.password) {
    return { error: "Email i hasło są wymagane" };
  }

  if (data.password.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków" };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { error: "Podaj prawidłowy adres email" };
  }

  // Attempt to sign up
  const { data: signUpData, error } = await supabase.auth.signUp(data);

  if (error) {
    // Log detailed error for debugging
    logger.error("Supabase signup error", { email: data.email }, error);
    
    // Return user-friendly Polish error messages
    if (error.message.includes("User already registered")) {
      return { error: "Ten email jest już zarejestrowany" };
    }
    if (error.message.includes("Password should be at least")) {
      return { error: "Hasło jest zbyt słabe" };
    }
    if (error.message.includes("Signups not allowed")) {
      return { error: "Rejestracja jest tymczasowo wyłączona" };
    }
    return { error: `Błąd rejestracji: ${error.message}` };
  }

  // Profile is created automatically by database trigger (handle_new_user)

  // If no session returned — email confirmation is required in Supabase settings
  // Redirect to login with info message instead of letting unconfirmed users into dashboard
  if (!signUpData.session) {
    redirect("/login?message=confirm-email");
  }

  // Session exists = email confirmation disabled, user is immediately active
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    logger.error("Sign out error", {}, error);
    // Even if there's an error, redirect anyway to clear client state
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
