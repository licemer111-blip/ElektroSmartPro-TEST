"use client";

import { Button } from "@/components/ui/button";
import { Crown, Zap, ArrowRight } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";

interface UpgradeProButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  fullWidth?: boolean;
}

export function UpgradeProButton({ 
  size = "sm", 
  variant = "default",
  className,
  fullWidth = false 
}: UpgradeProButtonProps) {
  const { onOpen } = useModalStore();

  return (
    <Button 
      size={size}
      variant={variant}
      className={className || "bg-amber-600 hover:bg-amber-700"}
      onClick={() => onOpen("proModal")}
      style={fullWidth ? { width: "100%" } : undefined}
    >
      {size === "lg" ? (
        <>
          <Zap className="w-5 h-5 mr-2.5" />
          <span>Kup PRO i odblokuj wszystko</span>
          <ArrowRight className="w-5 h-5 ml-2.5" />
        </>
      ) : (
        <>
          <Crown className="w-4 h-4 mr-2" />
          <span>Upgrade do PRO</span>
        </>
      )}
    </Button>
  );
}
