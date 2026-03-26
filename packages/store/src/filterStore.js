import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  selectedTeacherIds: [],
  selectedInstitutionIds: [],

  toggleTeacher: (id) =>
    set((state) => ({
      selectedTeacherIds: state.selectedTeacherIds.includes(id)
        ? state.selectedTeacherIds.filter((t) => t !== id)
        : [...state.selectedTeacherIds, id],
    })),

  toggleInstitution: (id) =>
    set((state) => ({
      selectedInstitutionIds: state.selectedInstitutionIds.includes(id)
        ? state.selectedInstitutionIds.filter((i) => i !== id)
        : [...state.selectedInstitutionIds, id],
    })),

  clearFilters: () =>
    set({ selectedTeacherIds: [], selectedInstitutionIds: [] }),
}));
