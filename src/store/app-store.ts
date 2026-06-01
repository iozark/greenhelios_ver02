import { create } from "zustand";

export type PageView =
  | "login"
  | "dashboard"
  | "properties"
  | "reports"
  | "notifications"
  | "profile"
  | "settings"
  | "help";

interface AppState {
  currentPage: PageView;
  sidebarOpen: boolean;
  setCurrentPage: (page: PageView) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
