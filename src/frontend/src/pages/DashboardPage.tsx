import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AddExpenseDialog } from "../components/AddExpenseDialog";
import { useExpenses } from "../hooks/useQueries";
import { useBudgets } from "../hooks/useQueries";
import { useSurvey } from "../hooks/useQueries";
import {
  computeFinancialScore,
  filterExpensesByMonth,
  formatCurrency,
  getAlerts,
  getBudgetStatuses,
  getCategoryDistribution,
  getCurrentMonthKey,
  getMonthlyTotals,
} from "../utils/finance";

function FinancialScoreGauge({ score }: { score: number }) {
  const radius = 70;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? "oklch(0.67 0.2 152)"
      : score >= 40
        ? "oklch(0.78 0.18 75)"
        : "oklch(0.62 0.22 25)";

  const label = score >= 70 ? "Excellent" : score >= 40 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: 180, height: 100 }}>
        <svg
          width="180"
          height="110"
          viewBox="0 0 180 110"
          className="overflow-visible"
          role="img"
          aria-label={`Financial score: ${score} out of 100`}
        >
          {/* Track */}
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke="oklch(0.89 0.02 255)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s ease, stroke 0.5s ease",
            }}
          />
          {/* Score text */}
          <text
            x="90"
            y="82"
            textAnchor="middle"
            className="font-display"
            style={{
              fontSize: 28,
              fontWeight: 800,
              fill: "oklch(0.18 0.025 255)",
              fontFamily: "Bricolage Grotesque, sans-serif",
            }}
          >
            {score}
          </text>
          <text
            x="90"
            y="98"
            textAnchor="middle"
            style={{
              fontSize: 11,
              fill: "oklch(0.5 0.04 255)",
              fontFamily: "Figtree, sans-serif",
            }}
          >
            / 100
          </text>
        </svg>
      </div>
      <span className="text-sm font-body font-semibold mt-1" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function BudgetProgressBar({
  category,
  spent,
  limit,
  pct,
  status,
}: {
  category: string;
  spent: number;
  limit: number;
  pct: number;
  status: "safe" | "warn" | "critical" | "over";
}) {
  const barClass = {
    safe: "budget-bar-safe",
    warn: "budget-bar-warn",
    critical: "budget-bar-crit",
    over: "budget-bar-over",
  }[status];

  const textColor = {
    safe: "text-success",
    warn: "text-warning",
    critical: "text-orange-600",
    over: "text-destructive",
  }[status];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-body font-medium text-foreground">
          {category}
        </span>
        <span className={cn("font-body text-xs font-semibold", textColor)}>
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            barClass,
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground font-body">
        {pct.toFixed(0)}% used
      </p>
    </div>
  );
}

const ALERT_CONFIG = {
  warn: {
    icon: AlertTriangle,
    bg: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
    label: "75% Warning",
  },
  critical: {
    icon: AlertCircle,
    bg: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
    label: "90% Critical",
  },
  over: {
    icon: XCircle,
    bg: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
    label: "Limit Exceeded",
  },
};

export function DashboardPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: expenses = [], isLoading: expLoading } = useExpenses();
  const { data: budgets = [], isLoading: budLoading } = useBudgets();
  const { data: survey, isLoading: surLoading } = useSurvey();

  const isLoading = expLoading || budLoading || surLoading;

  const currentMonth = getCurrentMonthKey();
  const currentExpenses = useMemo(
    () => filterExpensesByMonth(expenses, currentMonth),
    [expenses, currentMonth],
  );
  const score = useMemo(
    () => computeFinancialScore(expenses, budgets, survey ?? null),
    [expenses, budgets, survey],
  );
  const alerts = useMemo(
    () => getAlerts(expenses, budgets),
    [expenses, budgets],
  );
  const budgetStatuses = useMemo(
    () => getBudgetStatuses(expenses, budgets),
    [expenses, budgets],
  );
  const pieData = useMemo(
    () => getCategoryDistribution(currentExpenses),
    [currentExpenses],
  );
  const monthlyTotals = useMemo(() => getMonthlyTotals(expenses), [expenses]);
  const totalThisMonth = useMemo(
    () => currentExpenses.reduce((s, e) => s + e.amount, 0),
    [currentExpenses],
  );
  const totalLastMonth = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lm = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    return filterExpensesByMonth(expenses, lm).reduce(
      (s, e) => s + e.amount,
      0,
    );
  }, [expenses]);

  const trend =
    totalLastMonth > 0
      ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["score", "month", "tx", "budget"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-body mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          size="sm"
          className="gap-2 font-body"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const cfg = ALERT_CONFIG[alert.level];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={alert.category}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-sm font-body",
                  cfg.bg,
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", cfg.iconColor)} />
                <span>
                  <strong>{alert.category}</strong> — {cfg.label}: spent{" "}
                  {formatCurrency(alert.spent)} of {formatCurrency(alert.limit)}{" "}
                  ({alert.pct.toFixed(0)}%)
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="card-elevated card-interactive border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <FinancialScoreGauge score={score.total} />
            </CardContent>
          </Card>
        </motion.div>

        {/* This Month */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-elevated card-interactive border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <p className="font-display text-2xl font-bold text-foreground">
                {formatCurrency(totalThisMonth)}
              </p>
              <div
                className={cn(
                  "flex items-center gap-1 mt-1",
                  trend > 0 ? "text-destructive" : "text-success",
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-body">
                  {Math.abs(trend).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="card-elevated card-interactive border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <p className="font-display text-2xl font-bold text-foreground">
                {currentExpenses.length}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budgets Active */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-elevated card-interactive border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Budgets Active
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <p className="font-display text-2xl font-bold text-foreground">
                {budgets.length}
              </p>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <Wallet className="h-3 w-3" />
                <span className="text-xs font-body">
                  {alerts.length} alerts
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold">
                Spending by Category
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                Current month
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {pieData.length === 0 ? (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm font-body">
                    No expenses this month yet.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Amount",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid oklch(0.89 0.02 255)",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "Figtree, sans-serif",
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold">
                Monthly Spending
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                Last 6 months
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyTotals} barSize={28}>
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
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Total",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.89 0.02 255)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="oklch(0.52 0.18 250)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Line Chart + Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold">
                Spending Trend
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                Month over month
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyTotals}>
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
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Total",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.89 0.02 255)",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="oklch(0.67 0.2 152)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.67 0.2 152)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-elevated border-border/50">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="font-display text-base font-bold">
                Budget Utilization
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body">
                Current month
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {budgetStatuses.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-3">
                  <p className="text-muted-foreground text-sm font-body">
                    No budgets set yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body text-xs"
                    onClick={() => {
                      window.location.hash = "#/budget";
                    }}
                  >
                    Set Budgets
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                  {budgetStatuses.map((s) => (
                    <BudgetProgressBar key={s.category} {...s} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Footer */}
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
