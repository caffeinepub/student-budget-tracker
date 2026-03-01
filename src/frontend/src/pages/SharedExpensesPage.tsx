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
import {
  ArrowRight,
  Check,
  ChevronLeft,
  DollarSign,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ExpenseGroup, SplitType } from "../backend.d";
import {
  useAddSharedExpense,
  useCreateGroup,
  useGroupExpenses,
  useUserGroups,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/finance";

function CreateGroupDialog({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name.");
      return;
    }
    const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await createGroup.mutateAsync({ id, name: name.trim() });
      toast.success(`Group "${name}" created!`);
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create group.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            Create Group
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Group Name</Label>
            <Input
              placeholder="e.g. Flat 3B Roommates"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={createGroup.isPending}
              className="font-body"
            >
              {createGroup.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddSharedExpenseDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function AddSharedExpenseDialog({
  groupId,
  open,
  onOpenChange,
}: AddSharedExpenseDialogProps) {
  const addExpense = useAddSharedExpense();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!description.trim()) {
      toast.error("Enter a description.");
      return;
    }
    const st: SplitType =
      splitType === "equal"
        ? { __kind__: "equal", equal: null }
        : { __kind__: "custom", custom: [] };
    try {
      await addExpense.mutateAsync({
        groupId,
        amount: parsed,
        description: description.trim(),
        splitType: st,
      });
      toast.success("Shared expense added!");
      setAmount("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add shared expense.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            Add Shared Expense
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Amount (₹)</Label>
            <Input
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
            <Label className="font-body text-sm font-medium">Description</Label>
            <Input
              placeholder="e.g. Grocery run"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Split Type</Label>
            <Select
              value={splitType}
              onValueChange={(v) => setSplitType(v as "equal" | "custom")}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal" className="font-body">
                  Equal Split
                </SelectItem>
                <SelectItem value="custom" className="font-body">
                  Custom Split
                </SelectItem>
              </SelectContent>
            </Select>
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

interface GroupViewProps {
  group: ExpenseGroup & { id: string };
  onBack: () => void;
}

function GroupView({ group, onBack }: GroupViewProps) {
  const [addOpen, setAddOpen] = useState(false);
  const { data: expenses = [], isLoading } = useGroupExpenses(group.id);

  const totalAmount = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const perPerson =
    group.members.length > 0 ? totalAmount / group.members.length : 0;

  // Simple settlement summary
  const settlements = useMemo(() => {
    if (group.members.length < 2) return [];
    // For equal splits, each member owes (totalAmount / members) to payer
    // This is a simplified view since we don't track who paid
    return expenses
      .filter((e) => e.splitType.__kind__ === "equal")
      .map((e) => ({
        description: e.description,
        amount: e.amount,
        perPerson: e.amount / Math.max(group.members.length, 1),
      }));
  }, [expenses, group.members.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="font-body gap-2 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {group.name}
          </h2>
          <p className="text-xs text-muted-foreground font-body">
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          className="ml-auto gap-2 font-body"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Expenses", value: formatCurrency(totalAmount) },
          { label: "Per Person", value: formatCurrency(perPerson) },
          { label: "Transactions", value: String(expenses.length) },
        ].map(({ label, value }) => (
          <Card key={label} className="card-elevated border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="font-display text-xl font-bold text-foreground mt-1">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members */}
      <Card className="card-elevated border-border/50">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="font-display text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4" /> Members
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {group.members.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">
              No members yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <Badge
                  key={m.toString()}
                  variant="secondary"
                  className="font-body text-xs"
                >
                  {m.toString().slice(0, 12)}...
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="card-elevated border-border/50">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="font-display text-sm font-bold">
            Shared Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="space-y-2 px-5">
              {["sk1", "sk2", "sk3"].map((k) => (
                <Skeleton key={k} className="h-12" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-body">
                No shared expenses yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {expenses.map((e) => (
                <div
                  key={`${e.description}-${e.amount}`}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm text-foreground truncate">
                      {e.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-body capitalize">
                      {e.splitType.__kind__ === "equal"
                        ? "Equal split"
                        : "Custom split"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-sm text-foreground">
                      {formatCurrency(e.amount)}
                    </p>
                    {e.splitType.__kind__ === "equal" &&
                      group.members.length > 1 && (
                        <p className="text-xs text-muted-foreground font-body">
                          {formatCurrency(e.amount / group.members.length)}
                          /person
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Summary */}
      {settlements.length > 0 && (
        <Card className="card-elevated border-border/50">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="font-display text-sm font-bold">
              Settlement Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-xs text-muted-foreground font-body mb-3">
              Based on equal splits across {group.members.length} members
            </p>
            <div className="space-y-2">
              {settlements.map((s) => (
                <div
                  key={s.description}
                  className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-body font-medium text-foreground">
                      {s.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      Total: {formatCurrency(s.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-bold text-foreground">
                      {formatCurrency(s.perPerson)}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      per person
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body font-semibold text-foreground">
                  Total per person
                </span>
                <span className="font-display font-bold text-primary">
                  {formatCurrency(perPerson)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AddSharedExpenseDialog
        groupId={group.id}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}

export function SharedExpensesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<
    (ExpenseGroup & { id: string }) | null
  >(null);

  const { data: groups = [], isLoading } = useUserGroups();

  // Groups don't have an id field in ExpenseGroup, we need to derive one
  // We'll use the name as key for now (limitation of the backend type)
  const groupsWithId = useMemo(
    () =>
      groups.map((g, i) => ({
        ...g,
        id: `group_${i}_${g.name.replace(/\s+/g, "_").toLowerCase()}`,
      })),
    [groups],
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["g1", "g2", "g3", "g4"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {selectedGroup ? (
        <GroupView
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Shared Expenses
              </h1>
              <p className="text-muted-foreground text-sm font-body mt-0.5">
                Split bills with roommates & friends
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="gap-2 font-body"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Group</span>
            </Button>
          </div>

          {groupsWithId.length === 0 ? (
            <Card className="card-elevated border-border/50">
              <CardContent className="py-20 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-body font-semibold text-foreground">
                    No groups yet
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Create a group to start splitting expenses with roommates.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="font-body mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupsWithId.map((group, i) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Card
                    className="card-elevated card-interactive border-border/50 cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: "oklch(0.52 0.18 250 / 0.12)" }}
                        >
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-display font-bold text-foreground text-base">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {group.members.length} member
                        {group.members.length !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />

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
