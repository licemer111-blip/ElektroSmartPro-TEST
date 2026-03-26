"use client";

import { useEffect, useState } from "react";
import { CreateProjectModal } from "@/components/modals/create-project-modal";
import { ProModal } from "@/components/modals/pro-modal";
import { AddToProjectModal } from "@/components/modals/add-to-project-modal";

export function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration errors by not rendering on server
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateProjectModal />
      <ProModal />
      <AddToProjectModal />
    </>
  );
}
