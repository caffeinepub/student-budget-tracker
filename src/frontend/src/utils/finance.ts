import type { Budget, Expense, FinancialSurvey } from "../backend.d";

export const PREDEFINED_CATEGORIES = [
  "Food",
  "Transport",
  "Books",
  "Entertainment",
  "Shopping",
  "Rent",
  "Miscellaneous",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#52a8d4",
  Transport: "#6ab187",
  Books: "#e8a838",
  Entertainment: "#a06fbc",
  Shopping: "#e85f5c",
  Rent: "#4e8de3",
  Miscellaneous: "#8b95a5",
};

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

export function filterExpensesByMonth(
  expenses: Expense[],
  monthKey: string,
): Expense[] {
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return getMonthKey(d) === monthKey;
  });
}

export function getSpendingByCategory(
  expenses: Expense[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + e.amount;
  }
  return map;
}

export function getLast6MonthKeys(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(getMonthKey(d));
  }
  return result;
}

export interface BudgetStatus {
  category: string;
  spent: number;
  limit: number;
  pct: number;
  status: "safe" | "warn" | "critical" | "over";
}

export function getBudgetStatuses(
  expenses: Expense[],
  budgets: Budget[],
): BudgetStatus[] {
  const currentMonth = getCurrentMonthKey();
  const monthExpenses = filterExpensesByMonth(expenses, currentMonth);
  const spentByCategory = getSpendingByCategory(monthExpenses);

  return budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    let status: BudgetStatus["status"] = "safe";
    if (pct >= 100) status = "over";
    else if (pct >= 90) status = "critical";
    else if (pct >= 75) status = "warn";
    return { category: b.category, spent, limit: b.monthlyLimit, pct, status };
  });
}

export interface FinancialScore {
  total: number;
  adherence: number;
  discipline: number;
  savings: number;
  stressPenalty: number;
}

export function computeFinancialScore(
  expenses: Expense[],
  budgets: Budget[],
  survey: FinancialSurvey | null,
): FinancialScore {
  const currentMonth = getCurrentMonthKey();
  const monthExpenses = filterExpensesByMonth(expenses, currentMonth);
  const spentByCategory = getSpendingByCategory(monthExpenses);

  // Adherence: 40pts
  let adherence = 40;
  if (budgets.length > 0) {
    let underBudget = 0;
    for (const b of budgets) {
      const spent = spentByCategory[b.category] || 0;
      if (spent <= b.monthlyLimit) underBudget++;
    }
    adherence = Math.round((underBudget / budgets.length) * 40);
  }

  // Discipline: 30pts
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  let discipline = 30;
  if (totalBudget > 0) {
    const ratio = totalSpent / totalBudget;
    if (ratio <= 0.8) {
      discipline = 30;
    } else if (ratio >= 1.2) {
      discipline = 0;
    } else {
      discipline = Math.round(30 * (1 - (ratio - 0.8) / 0.4));
    }
  }

  // Emergency savings: 20pts
  const savings = survey?.emergencySavings ? 20 : 0;

  // Stress penalty: max 10pts subtracted
  const stressLevel = survey ? Number(survey.stressLevel) : 1;
  const stressPenalty = Math.round((stressLevel - 1) * 2.5);

  const total = Math.max(
    0,
    Math.min(100, adherence + discipline + savings - stressPenalty),
  );
  return { total, adherence, discipline, savings, stressPenalty };
}

export interface AlertItem {
  category: string;
  pct: number;
  spent: number;
  limit: number;
  level: "warn" | "critical" | "over";
}

export function getAlerts(expenses: Expense[], budgets: Budget[]): AlertItem[] {
  const statuses = getBudgetStatuses(expenses, budgets);
  return statuses
    .filter((s) => s.status !== "safe")
    .map((s) => ({
      category: s.category,
      pct: s.pct,
      spent: s.spent,
      limit: s.limit,
      level: s.status as "warn" | "critical" | "over",
    }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthlyTotals(
  expenses: Expense[],
): { month: string; total: number }[] {
  const months = getLast6MonthKeys();
  return months.map((m) => ({
    month: formatMonthLabel(m),
    total: filterExpensesByMonth(expenses, m).reduce(
      (sum, e) => sum + e.amount,
      0,
    ),
  }));
}

export function getCategoryDistribution(
  expenses: Expense[],
): { name: string; value: number; color: string }[] {
  const spent = getSpendingByCategory(expenses);
  return Object.entries(spent)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#8b95a5",
    }))
    .sort((a, b) => b.value - a.value);
}

export function getTopCategories(
  expenses: Expense[],
  n = 3,
): { category: string; amount: number }[] {
  const spent = getSpendingByCategory(expenses);
  return Object.entries(spent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([category, amount]) => ({ category, amount }));
}

export function getBehavioralInsights(
  expenses: Expense[],
  budgets: Budget[],
): string[] {
  const insights: string[] = [];
  const months = getLast6MonthKeys();

  // Check for repeated overspending
  const categoryOverspendCount: Record<string, number> = {};
  for (const month of months) {
    const monthExp = filterExpensesByMonth(expenses, month);
    const spent = getSpendingByCategory(monthExp);
    for (const b of budgets) {
      if ((spent[b.category] || 0) > b.monthlyLimit) {
        categoryOverspendCount[b.category] =
          (categoryOverspendCount[b.category] || 0) + 1;
      }
    }
  }
  for (const [cat, count] of Object.entries(categoryOverspendCount)) {
    if (count >= 2) {
      insights.push(
        `You overspent on ${cat} in ${count} of the last 6 months.`,
      );
    }
  }

  // Top category insight
  const currentMonth = getCurrentMonthKey();
  const monthExp = filterExpensesByMonth(expenses, currentMonth);
  const top = getTopCategories(monthExp, 1);
  if (top.length > 0) {
    insights.push(
      `${top[0].category} is your biggest expense this month (${formatCurrency(top[0].amount)}).`,
    );
  }

  // Spending trend
  const totals = getMonthlyTotals(expenses);
  const recent = totals.slice(-2);
  if (recent.length === 2 && recent[1].total > recent[0].total * 1.2) {
    insights.push(
      "Your spending increased by more than 20% compared to last month.",
    );
  } else if (recent.length === 2 && recent[1].total < recent[0].total * 0.8) {
    insights.push(
      "Great job! Your spending decreased by more than 20% compared to last month.",
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Keep tracking your expenses to unlock personalized insights.",
    );
  }
  return insights;
}

export function getSavingTips(
  expenses: Expense[],
  _budgets: Budget[],
  survey: FinancialSurvey | null,
): string[] {
  const tips: string[] = [];
  const currentMonth = getCurrentMonthKey();
  const monthExp = filterExpensesByMonth(expenses, currentMonth);
  const spentByCategory = getSpendingByCategory(monthExp);
  const totalSpent = monthExp.reduce((s, e) => s + e.amount, 0);

  if ((spentByCategory.Food || 0) > 5000) {
    tips.push("Cook more meals at home — eating out regularly adds up fast.");
  }
  if ((spentByCategory.Entertainment || 0) > 2000) {
    tips.push("Look for free or low-cost entertainment options on campus.");
  }
  if (!survey?.emergencySavings) {
    tips.push("Start an emergency fund — even ₹500/month adds up over time.");
  }
  if (totalSpent > 0) {
    tips.push(
      `Try saving 10% of your income — that's roughly ${formatCurrency(totalSpent * 0.1)} based on current spending.`,
    );
  }
  tips.push(
    "Use the 24-hour rule before non-essential purchases to avoid impulse buying.",
  );
  tips.push(
    "Review subscriptions monthly — cancel services you haven't used this month.",
  );
  return tips.slice(0, 5);
}
