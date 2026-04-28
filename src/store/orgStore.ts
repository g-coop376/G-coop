import { create } from 'zustand';

interface OrgStore {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const currentMonth = new Date().toISOString().slice(0, 7);

export const useOrgStore = create<OrgStore>(set => ({
  selectedMonth: currentMonth,
  setSelectedMonth: selectedMonth => set({ selectedMonth }),
}));
