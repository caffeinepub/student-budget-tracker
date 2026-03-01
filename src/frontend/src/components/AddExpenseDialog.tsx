import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddExpense, useCategories } from "../hooks/useQueries";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  const { data: categories = [] } = useCategories();
  const addExpense = useAddExpense();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  function resetForm() {
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category || !date) {
      toast.error("Please fill in amount, category, and date.");
      return;
    }
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await addExpense.mutateAsync({
        amount: parsed,
        category,
        date,
        note,
      });
      toast.success("Expense added successfully!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to add expense. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Add Expense
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="font-body text-sm font-medium">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="font-body text-sm font-medium">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="font-body">
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

          <div className="space-y-1.5">
            <Label htmlFor="date" className="font-body text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="font-body text-sm font-medium">
              Note (optional)
            </Label>
            <Textarea
              id="note"
              placeholder="What was this expense for?"
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
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
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
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
