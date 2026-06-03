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
  setCurrentPage: (page: PageView) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
