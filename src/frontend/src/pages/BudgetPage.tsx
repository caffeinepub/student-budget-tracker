import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, PiggyBank, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useBudgets,
  useCategories,
  useExpenses,
  useSetBudget,
} from "../hooks/useQueries";
import {
  CATEGORY_COLORS,
  formatCurrency,
  getBudgetStatuses,
} from "../utils/finance";

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  pct: number;
  status: "safe" | "warn" | "critical" | "over";
  onEdit: () => void;
}

function BudgetCard({
  category,
  spent,
  limit,
  pct,
  status,
  onEdit,
}: BudgetCardProps) {
  const color = CATEGORY_COLORS[category] || "#8b95a5";
  const barClass = {
    safe: "budget-bar-safe",
    warn: "budget-bar-warn",
    critical: "budget-bar-crit",
    over: "budget-bar-over",
  }[status];
  const statusLabel = {
    safe: "On Track",
    warn: "75%+ Used",
    critical: "90%+ Used",
    over: "Over Budget",
  }[status];
  const statusColor = {
    safe: "text-success bg-green-50",
    warn: "text-warning bg-amber-50",
    critical: "text-orange-600 bg-orange-50",
    over: "text-destructive bg-red-50",
  }[status];

  return (
    <Card className="card-elevated card-interactive border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <PiggyBank className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="font-body font-semibold text-foreground text-sm">
                {category}
              </p>
              <span
                className={cn(
                  "text-xs font-body font-medium px-2 py-0.5 rounded-full",
                  statusColor,
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="font-body text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            Edit
          </Button>
        </div>

        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                barClass,
              )}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-body">
            <span className="text-muted-foreground">
              Spent:{" "}
              <strong className="text-foreground">
                {formatCurrency(spent)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Limit:{" "}
              <strong className="text-foreground">
                {formatCurrency(limit)}
              </strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-body">
            <span className="text-muted-foreground">
              Remaining:{" "}
              <strong
                className={
                  limit - spent < 0 ? "text-destructive" : "text-success"
                }
              >
                {formatCurrency(Math.max(0, limit - spent))}
              </strong>
            </span>
            <span className="text-muted-foreground">
              {pct.toFixed(0)}% used
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  editCategory?: string;
  editLimit?: number;
}

function BudgetDialog({
  open,
  onOpenChange,
  categories,
  editCategory,
  editLimit,
}: BudgetDialogProps) {
  const setBudget = useSetBudget();
  const [category, setCategory] = useState(editCategory || "");
  const [limit, setLimit] = useState(editLimit?.toString() || "");

  const isEdit = !!editCategory;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseFloat(limit);
    if (!category || Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Please select a category and enter a valid limit.");
      return;
    }
    try {
      await setBudget.mutateAsync({
        category: isEdit ? editCategory! : category,
        limit: parsed,
      });
      toast.success(isEdit ? "Budget updated!" : "Budget set!");
      onOpenChange(false);
      setCategory("");
      setLimit("");
    } catch {
      toast.error("Failed to save budget.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            {isEdit ? "Edit Budget" : "Set Budget"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit ? (
            <div className="space-y-1.5">
              <Label className="font-body text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="font-body">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="font-body text-sm font-medium">Category</Label>
              <Input
                value={editCategory}
                readOnly
                className="font-body bg-muted"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">
              Monthly Limit (₹)
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="font-body"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={setBudget.isPending}
              className="font-body"
            >
              {setBudget.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Set Budget"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BudgetPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<{
    category: string;
    limit: number;
  } | null>(null);

  const { data: expenses = [], isLoading: expLoading } = useExpenses();
  const { data: budgets = [], isLoading: budLoading } = useBudgets();
  const { data: categories = [] } = useCategories();

  const statuses = getBudgetStatuses(expenses, budgets);
  const totalBudgeted = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);
  const overCount = statuses.filter((s) => s.status === "over").length;

  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.category === c),
  );

  if (expLoading || budLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["b1", "b2", "b3"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
            <Skeleton key={k} className="h-40 rounded-xl" />
          ))}
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
            Budget
          </h1>
          <p className="text-muted-foreground text-sm font-body mt-0.5">
            Manage monthly spending limits
          </p>
        </div>
        {availableCategories.length > 0 && (
          <Button
            onClick={() => setAddOpen(true)}
            size="sm"
            className="gap-2 font-body"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Set Budget</span>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Budgeted",
            value: formatCurrency(totalBudgeted),
            sub: "per month",
          },
          {
            label: "Total Spent",
            value: formatCurrency(totalSpent),
            sub: `${totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : 0}% of budget`,
          },
          {
            label: "Over Budget",
            value: `${overCount}`,
            sub: `categor${overCount === 1 ? "y" : "ies"}`,
          },
        ].map(({ label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="card-elevated border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <p className="font-display text-2xl font-bold text-foreground mt-1">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Budget Cards */}
      {statuses.length === 0 ? (
        <Card className="card-elevated border-border/50">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-body font-semibold text-foreground">
              No budgets set yet
            </p>
            <p className="text-sm text-muted-foreground font-body text-center">
              Set spending limits for categories to track your budget usage.
            </p>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="font-body mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Set First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statuses.map((s, i) => (
            <motion.div
              key={s.category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <BudgetCard
                {...s}
                onEdit={() =>
                  setEditItem({ category: s.category, limit: s.limit })
                }
              />
            </motion.div>
          ))}
        </div>
      )}

      <BudgetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={availableCategories}
      />

      {editItem && (
        <BudgetDialog
          open={!!editItem}
          onOpenChange={(o) => {
            if (!o) setEditItem(null);
          }}
          categories={categories}
          editCategory={editItem.category}
          editLimit={editItem.limit}
        />
      )}

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
