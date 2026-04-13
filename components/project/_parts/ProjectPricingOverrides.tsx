"use client";

// KNR coefficients feature removed — component returns null.
// Props kept for interface compatibility with callers until they are cleaned up.
interface ProjectPricingOverridesProps {
  projectId?:   string;
  profile?:     unknown;
  overrides?:   unknown;
  isFinal?:     boolean;
  isPro?:       boolean;
}

export function ProjectPricingOverrides(_props: ProjectPricingOverridesProps) {
  return null;
}
