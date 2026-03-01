import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Budget,
  Expense,
  ExpenseGroup,
  FinancialSurvey,
  SharedExpense,
  SplitType,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Expenses ───────────────────────────────────────────────────────────────
export function useExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Expense) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addExpense(expense);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// ─── Categories ─────────────────────────────────────────────────────────────
export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      const backendCats = await actor.getCategories();
      const predefined = [
        "Food",
        "Transport",
        "Books",
        "Entertainment",
        "Shopping",
        "Rent",
        "Miscellaneous",
      ];
      const combined = [...new Set([...predefined, ...backendCats])];
      return combined;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addCustomCategory(category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ─── Budgets ────────────────────────────────────────────────────────────────
export function useBudgets() {
  const { actor, isFetching } = useActor();
  return useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBudgets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetBudget() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      limit,
    }: { category: string; limit: number }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setBudget(category, limit);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

// ─── Profile ────────────────────────────────────────────────────────────────
export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ─── Survey ─────────────────────────────────────────────────────────────────
export function useSurvey() {
  const { actor, isFetching } = useActor();
  return useQuery<FinancialSurvey | null>({
    queryKey: ["survey"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSurvey();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitSurvey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (survey: FinancialSurvey) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.submitSurvey(survey);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

// ─── Groups ─────────────────────────────────────────────────────────────────
export function useUserGroups() {
  const { actor, isFetching } = useActor();
  return useQuery<ExpenseGroup[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createGroup(id, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useGroupExpenses(groupId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SharedExpense[]>({
    queryKey: ["groupExpenses", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getGroupExpenses(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

export function useAddSharedExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      amount,
      description,
      splitType,
    }: {
      groupId: string;
      amount: number;
      description: string;
      splitType: SplitType;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addSharedExpense(groupId, amount, description, splitType);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["groupExpenses", variables.groupId] });
    },
  });
}

export function useMarkSettlementPaid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      index,
    }: { groupId: string; index: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.markSettlementPaid(groupId, index);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["groupExpenses", variables.groupId] });
    },
  });
}
