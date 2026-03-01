import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart3,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBudgets, useExpenses, useSurvey } from "../hooks/useQueries";
import {
  CATEGORY_COLORS,
  filterExpensesByMonth,
  formatCurrency,
  formatMonthLabel,
  getBehavioralInsights,
  getCategoryDistribution,
  getCurrentMonthKey,
  getLast6MonthKeys,
  getSavingTips,
  getTopCategories,
} from "../utils/finance";

export function ReportsPage() {
  const { data: expenses = [], isLoading: expLoading } = useExpenses();
  const { data: budgets = [], isLoading: budLoading } = useBudgets();
  const { data: survey, isLoading: surLoading } = useSurvey();

  const isLoading = expLoading || budLoading || surLoading;

  const currentMonth = getCurrentMonthKey();
  const currentExpenses = useMemo(
    () => filterExpensesByMonth(expenses, currentMonth),
    [expenses, currentMonth],
  );
  const topCategories = useMemo(
    () => getTopCategories(currentExpenses, 5),
    [currentExpenses],
  );
  const insights = useMemo(
    () => getBehavioralInsights(expenses, budgets),
    [expenses, budgets],
  );
  const tips = useMemo(
    () => getSavingTips(expenses, budgets, survey ?? null),
    [expenses, budgets, survey],
  );

  const totalThisMonth = useMemo(
    () => currentExpenses.reduce((s, e) => s + e.amount, 0),
    [currentExpenses],
  );
  const totalLastMonth = useMemo(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lm = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
    return filterExpensesByMonth(expenses, lm).reduce(
      (s, e) => s + e.amount,
      0,
    );
  }, [expenses]);

  const trend =
    totalLastMonth > 0
      ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
      : 0;

  // Category comparison data
  const months = useMemo(() => getLast6MonthKeys(), []);
  const categoryBarData = useMemo(() => {
    return months.map((m) => {
      const mExp = filterExpensesByMonth(expenses, m);
      const byCat: Record<string, number> = {};
      for (const e of mExp)
        byCat[e.category] = (byCat[e.category] || 0) + e.amount;
      return { month: formatMonthLabel(m), ...byCat };
    });
  }, [expenses, months]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const e of expenses) cats.add(e.category);
    return Array.from(cats);
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Reports
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-0.5">
          Financial insights and analysis
        </p>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "This Month",
            value: formatCurrency(totalThisMonth),
            sub:
              trend !== 0
                ? `${Math.abs(trend).toFixed(1)}% vs last month`
                : "First month data",
            icon: trend > 0 ? TrendingUp : TrendingDown,
            color: trend > 0 ? "text-destructive" : "text-success",
          },
          {
            label: "Last Month",
            value: formatCurrency(totalLastMonth),
            sub: "Previous month total",
            icon: BarChart3,
            color: "text-muted-foreground",
          },
          {
            label: "Transactions",
            value: String(currentExpenses.length),
            sub: "this month",
            icon: BarChart3,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, sub, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="card-elevated border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <p className="font-display text-2xl font-bold text-foreground">
                  {value}
                </p>
                <p className="text-xs font-body mt-0.5 text-muted-foreground">
                  {sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="card-elevated border-border/50">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="font-display text-base font-bold">
              Category Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground font-body">
              Monthly spending by category
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {expenses.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-muted-foreground text-sm font-body">
                  No expense data yet.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryBarData} barSize={14}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.89 0.02 255)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fontFamily: "Figtree, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "Figtree, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.89 0.02 255)",
                      fontSize: 12,
                    }}
                  />
                  {allCategories.map((cat) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={CATEGORY_COLORS[cat] || "#8b95a5"}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Categories + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold">
                Top Categories
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                This month's highest spending
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {topCategories.length === 0 ? (
                <div className="py-8 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm font-body">
                    No data this month.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCategories.map(({ category, amount }, i) => {
                    const maxAmount = topCategories[0].amount;
                    const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                    const color = CATEGORY_COLORS[category] || "#8b95a5";
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-body font-semibold text-xs text-muted-foreground w-4">
                              {i + 1}.
                            </span>
                            <span className="font-body font-medium text-foreground">
                              {category}
                            </span>
                          </div>
                          <span className="font-display font-bold text-foreground text-sm">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Behavioral Insights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Behavioral Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                Pattern analysis from your data
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2.5">
                {insights.map((insight, i) => (
                  <div
                    key={insight.slice(0, 30)}
                    className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-display font-bold text-primary">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-sm font-body text-foreground">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Saving Tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="card-elevated border-border/50">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="font-display text-base font-bold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              Saving Tips
            </CardTitle>
            <p className="text-xs text-muted-foreground font-body">
              Personalized recommendations
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tips.map((tip) => (
                <div
                  key={tip.slice(0, 20)}
                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm font-body text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <footer className="text-center py-4 text-xs text-muted-foreground font-body">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
