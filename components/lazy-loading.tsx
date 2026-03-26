"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

// Lazy loaded heavy components (only existing ones)
export const LazyEstimateTable = dynamic(
  () => import("./project/estimate-table").then(mod => ({ default: mod.EstimateTable })),
  { 
    loading: LoadingSpinner,
    ssr: false
  }
);

export const LazyCatalogTable = dynamic(
  () => import("../app/dashboard/catalog/catalog-table").then(mod => ({ default: mod.CatalogTable })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

export const LazyProjectViewClient = dynamic(
  () => import("./project/project-view-client").then(mod => ({ default: mod.ProjectViewClient })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

// Mobile components
export const LazyMobileCatalogSheet = dynamic(
  () => import("./project/mobile-catalog-sheet").then(mod => ({ default: mod.MobileCatalogSheet })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
);

// Re-export for easier importing
export { MobileCatalogSheet } from "./project/mobile-catalog-sheet";
