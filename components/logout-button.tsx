"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Use window.location.href for full page reload
    // This clears all client-side cache and state
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center cursor-pointer text-left"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Wyloguj
    </button>
  );
}
