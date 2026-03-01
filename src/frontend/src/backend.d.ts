import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FinancialSurvey {
    stressLevel: bigint;
    sharedExpenseBehavior: string;
    incomeSource: string;
    incomeRange: string;
    financialHabits: string;
    biggestProblem: string;
    emergencySavings: boolean;
}
export interface ExpenseGroup {
    members: Array<Principal>;
    name: string;
}
export interface SharedExpense {
    splitType: SplitType;
    description: string;
    groupId: string;
    amount: number;
}
export type SplitType = {
    __kind__: "custom";
    custom: Array<[Principal, number]>;
} | {
    __kind__: "equal";
    equal: null;
};
export interface Expense {
    date: string;
    note: string;
    category: string;
    amount: number;
}
export interface UserProfile {
    age: bigint;
    livingSituation: string;
    name: string;
    gender: string;
    course: string;
}
export interface Budget {
    monthlyLimit: number;
    category: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomCategory(category: string): Promise<void>;
    addExpense(expense: Expense): Promise<void>;
    addMember(groupId: string, member: Principal): Promise<void>;
    addSharedExpense(groupId: string, amount: number, description: string, splitType: SplitType): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(id: string, name: string): Promise<void>;
    createOrUpdateProfile(profile: UserProfile): Promise<void>;
    getBudgets(): Promise<Array<Budget>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<string>>;
    getExpenses(): Promise<Array<Expense>>;
    getGroupExpenses(groupId: string): Promise<Array<SharedExpense>>;
    getProfile(): Promise<UserProfile | null>;
    getSurvey(): Promise<FinancialSurvey | null>;
    getUserGroups(): Promise<Array<ExpenseGroup>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markSettlementPaid(groupId: string, settlementIndex: bigint): Promise<void>;
    removeMember(groupId: string, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBudget(category: string, limit: number): Promise<void>;
    submitSurvey(survey: FinancialSurvey): Promise<void>;
}
