"use client";

import dynamic from "next/dynamic";

const HeaderClient = dynamic(() => import("@/components/header-client"), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
      <div className="flex h-16 items-center px-4" />
    </header>
  ),
});

export { HeaderClient as HeaderDynamic };
