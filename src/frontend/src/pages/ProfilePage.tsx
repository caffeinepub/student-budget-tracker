import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FinancialSurvey, UserProfile } from "../backend.d";
import {
  useProfile,
  useSaveProfile,
  useSubmitSurvey,
  useSurvey,
} from "../hooks/useQueries";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const LIVING_OPTIONS = [
  "With family",
  "College hostel",
  "Shared apartment",
  "Alone",
  "Other",
];
const INCOME_SOURCE_OPTIONS = [
  "Parents/Family",
  "Part-time job",
  "Scholarship",
  "Freelance",
  "Multiple sources",
];
const INCOME_RANGE_OPTIONS = [
  "< ₹5,000",
  "₹5,000–₹10,000",
  "₹10,000–₹20,000",
  "₹20,000–₹30,000",
  "> ₹30,000",
];
const HABITS_OPTIONS = [
  "Track daily expenses",
  "Set monthly budget",
  "Save regularly",
  "Impulse spending",
  "Borrow often",
  "None of the above",
];
const SHARED_BEHAVIOR_OPTIONS = [
  "I usually pay and collect",
  "We split equally",
  "I prefer digital tracking",
  "We settle monthly",
  "Rarely split expenses",
];

const STRESS_LABELS = [
  "No stress",
  "Mild stress",
  "Moderate",
  "High stress",
  "Very high stress",
];

export function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: survey, isLoading: surveyLoading } = useSurvey();
  const saveProfile = useSaveProfile();
  const submitSurvey = useSubmitSurvey();

  // Profile form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [course, setCourse] = useState("");
  const [living, setLiving] = useState("");

  // Survey form state
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [habits, setHabits] = useState("");
  const [stressLevel, setStressLevel] = useState(1);
  const [emergencySavings, setEmergencySavings] = useState(false);
  const [sharedBehavior, setSharedBehavior] = useState("");
  const [biggestProblem, setBiggestProblem] = useState("");

  // Sync from loaded data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age ? profile.age.toString() : "");
      setGender(profile.gender || "");
      setCourse(profile.course || "");
      setLiving(profile.livingSituation || "");
    }
  }, [profile]);

  useEffect(() => {
    if (survey) {
      setIncomeSource(survey.incomeSource || "");
      setIncomeRange(survey.incomeRange || "");
      setHabits(survey.financialHabits || "");
      setStressLevel(Number(survey.stressLevel) || 1);
      setEmergencySavings(survey.emergencySavings || false);
      setSharedBehavior(survey.sharedExpenseBehavior || "");
      setBiggestProblem(survey.biggestProblem || "");
    }
  }, [survey]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const ageNum = Number.parseInt(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 14 || ageNum > 100) {
      toast.error("Please enter a valid age (14–100).");
      return;
    }
    try {
      const profileData: UserProfile = {
        name: name.trim(),
        age: BigInt(ageNum),
        gender,
        course: course.trim(),
        livingSituation: living,
      };
      await saveProfile.mutateAsync(profileData);
      toast.success("Profile saved successfully!");
    } catch {
      toast.error("Failed to save profile.");
    }
  }

  async function handleSubmitSurvey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const surveyData: FinancialSurvey = {
        incomeSource,
        incomeRange,
        financialHabits: habits,
        stressLevel: BigInt(stressLevel),
        emergencySavings,
        sharedExpenseBehavior: sharedBehavior,
        biggestProblem: biggestProblem.trim(),
      };
      await submitSurvey.mutateAsync(surveyData);
      toast.success("Survey submitted successfully!");
    } catch {
      toast.error("Failed to submit survey.");
    }
  }

  if (profileLoading || surveyLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Profile & Survey
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-0.5">
          Your personal information and financial survey
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="font-body">
          <TabsTrigger value="profile" className="gap-2 font-body">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="survey" className="gap-2 font-body">
            <FileText className="h-3.5 w-3.5" />
            Financial Survey
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="card-elevated border-border/50">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="font-display text-base font-bold">
                  Personal Information
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">
                  Basic demographic details
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="name"
                        className="font-body text-sm font-medium"
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Arjun Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="age"
                        className="font-body text-sm font-medium"
                      >
                        Age *
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min="14"
                        max="100"
                        placeholder="20"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="font-body"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-body text-sm font-medium">
                        Gender
                      </Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((g) => (
                            <SelectItem key={g} value={g} className="font-body">
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="course"
                        className="font-body text-sm font-medium"
                      >
                        Course / Stream
                      </Label>
                      <Input
                        id="course"
                        placeholder="B.Tech Computer Science"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="font-body"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">
                      Living Situation
                    </Label>
                    <Select value={living} onValueChange={setLiving}>
                      <SelectTrigger className="font-body w-full sm:w-72">
                        <SelectValue placeholder="Select living situation" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIVING_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o} className="font-body">
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={saveProfile.isPending}
                      className="font-body gap-2"
                    >
                      {saveProfile.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Survey Tab */}
        <TabsContent value="survey">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="card-elevated border-border/50">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="font-display text-base font-bold">
                  Financial Survey
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">
                  Help us personalize your financial insights by answering these
                  questions.
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmitSurvey} className="space-y-6">
                  {/* Income Section */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-sm text-foreground border-b border-border pb-2">
                      Income
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body text-sm font-medium">
                          Income Source
                        </Label>
                        <Select
                          value={incomeSource}
                          onValueChange={setIncomeSource}
                        >
                          <SelectTrigger className="font-body">
                            <SelectValue placeholder="Primary income source" />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_SOURCE_OPTIONS.map((o) => (
                              <SelectItem
                                key={o}
                                value={o}
                                className="font-body"
                              >
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body text-sm font-medium">
                          Monthly Income Range
                        </Label>
                        <Select
                          value={incomeRange}
                          onValueChange={setIncomeRange}
                        >
                          <SelectTrigger className="font-body">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_RANGE_OPTIONS.map((o) => (
                              <SelectItem
                                key={o}
                                value={o}
                                className="font-body"
                              >
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Habits Section */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-sm text-foreground border-b border-border pb-2">
                      Financial Habits
                    </h3>
                    <div className="space-y-1.5">
                      <Label className="font-body text-sm font-medium">
                        Primary Financial Habit
                      </Label>
                      <Select value={habits} onValueChange={setHabits}>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select your main habit" />
                        </SelectTrigger>
                        <SelectContent>
                          {HABITS_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o} className="font-body">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-sm font-medium">
                        Shared Expense Behavior
                      </Label>
                      <Select
                        value={sharedBehavior}
                        onValueChange={setSharedBehavior}
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="How do you handle shared expenses?" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHARED_BEHAVIOR_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o} className="font-body">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Stress & Savings */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-sm text-foreground border-b border-border pb-2">
                      Financial Wellbeing
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-body text-sm font-medium">
                          Financial Stress Level
                        </Label>
                        <span className="text-sm font-body font-semibold text-primary">
                          {stressLevel}/5 — {STRESS_LABELS[stressLevel - 1]}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[stressLevel]}
                        onValueChange={([v]) => setStressLevel(v)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-body">
                        <span>No stress</span>
                        <span>Very stressed</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/60">
                      <div>
                        <p className="font-body font-medium text-sm text-foreground">
                          Emergency Savings
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5">
                          Do you have an emergency fund?
                        </p>
                      </div>
                      <Switch
                        checked={emergencySavings}
                        onCheckedChange={setEmergencySavings}
                      />
                    </div>
                  </div>

                  {/* Biggest Problem */}
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">
                      Biggest Financial Problem
                    </Label>
                    <Textarea
                      placeholder="Describe your biggest financial challenge as a student..."
                      value={biggestProblem}
                      onChange={(e) => setBiggestProblem(e.target.value)}
                      rows={3}
                      className="font-body resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={submitSurvey.isPending}
                      className="font-body gap-2"
                    >
                      {submitSurvey.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Submit Survey
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

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
