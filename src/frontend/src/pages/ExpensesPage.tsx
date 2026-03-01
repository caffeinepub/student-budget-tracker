import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronDown, Edit2, Filter, Plus, Search, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import { AddExpenseDialog } from "../components/AddExpenseDialog";
import { useAddExpense, useCategories, useExpenses } from "../hooks/useQueries";
import {
  CATEGORY_COLORS,
  formatCurrency,
  formatMonthLabel,
  getLast6MonthKeys,
} from "../utils/finance";

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || "#8b95a5";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-body font-medium"
      style={{ background: `${color}20`, color }}
    >
      {category}
    </span>
  );
}

interface EditDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
}

function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  categories,
}: EditDialogProps) {
  const addExpense = useAddExpense();
  const [amount, setAmount] = useState(expense?.amount.toString() || "");
  const [category, setCategory] = useState(expense?.category || "");
  const [date, setDate] = useState(expense?.date || "");
  const [note, setNote] = useState(expense?.note || "");

  // Sync when expense changes
  useMemo(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDate(expense.date);
      setNote(expense.note);
    }
  }, [expense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Invalid amount");
      return;
    }
    try {
      await addExpense.mutateAsync({ amount: parsed, category, date, note });
      toast.success("Expense updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update expense.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            Edit Expense
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="font-body">
                <SelectValue />
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
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="font-body resize-none"
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
              disabled={addExpense.isPending}
              className="font-body"
            >
              {addExpense.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ExpensesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [search, setSearch] = useState("");

  const { data: expenses = [], isLoading } = useExpenses();
  const { data: categories = [] } = useCategories();

  const monthOptions = useMemo(
    () =>
      getLast6MonthKeys().map((k) => ({ key: k, label: formatMonthLabel(k) })),
    [],
  );

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterCategory !== "all" && e.category !== filterCategory)
          return false;
        if (filterMonth !== "all") {
          const d = new Date(e.date);
          const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (mk !== filterMonth) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (
            !e.category.toLowerCase().includes(q) &&
            !e.note.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterCategory, filterMonth, search]);

  const totalFiltered = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Expenses
          </h1>
          <p className="text-muted-foreground text-sm font-body mt-0.5">
            {expenses.length} total expenses
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

      {/* Filters */}
      <Card className="card-elevated border-border/50">
        <CardContent className="py-4 px-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-body text-sm"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 font-body text-sm">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-body">
                  All categories
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-36 font-body text-sm">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-body">
                  All months
                </SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m.key} value={m.key} className="font-body">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm font-body">
          <span className="text-muted-foreground">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold text-foreground">
            Total: {formatCurrency(totalFiltered)}
          </span>
        </div>
      )}

      {/* Expense List */}
      <Card className="card-elevated border-border/50">
        {filtered.length === 0 ? (
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-body font-medium text-foreground">
              No expenses found
            </p>
            <p className="text-sm text-muted-foreground font-body text-center">
              {expenses.length === 0
                ? "Add your first expense to get started!"
                : "Try adjusting your filters."}
            </p>
            {expenses.length === 0 && (
              <Button
                size="sm"
                onClick={() => setAddOpen(true)}
                className="font-body mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Add First Expense
              </Button>
            )}
          </CardContent>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((expense, i) => (
              <motion.div
                key={`${expense.date}-${expense.category}-${expense.amount}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                {/* Date */}
                <div className="shrink-0 w-14 text-center">
                  <p className="text-xs font-body font-bold text-foreground">
                    {new Date(expense.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>

                {/* Category */}
                <div className="shrink-0">
                  <CategoryBadge category={expense.category} />
                </div>

                {/* Note */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-foreground truncate">
                    {expense.note || (
                      <span className="text-muted-foreground italic">
                        No note
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <div className="shrink-0 text-right">
                  <p className="font-display font-bold text-foreground text-sm">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditExpense(expense)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditExpenseDialog
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(o) => {
          if (!o) setEditExpense(null);
        }}
        categories={categories}
      />

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
