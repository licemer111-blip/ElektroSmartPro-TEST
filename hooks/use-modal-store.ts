import { create } from 'zustand';
import type { Region, ObjectType } from '@/lib/types/database';
import type { ExtractedMaterial } from '@/app/dashboard/ai-lab/actions';

export type ModalType = 'createProject' | 'proModal' | 'addToProject';

interface ModalData {
  regions?: Region[];
  objectTypes?: ObjectType[];
  currentProjectCount?: number;
  isPro?: boolean;
  maxProjects?: number;
  defaultRegionId?: string | null;
  hourlyRate?: number;
  materials?: ExtractedMaterial[];
  onSuccess?: () => void;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
