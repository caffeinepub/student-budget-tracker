import { createRootRoute, createRoute } from "@tanstack/react-router";
import { AuthGuard } from "./components/AuthGuard";
import { RootLayout } from "./layouts/RootLayout";
import { BudgetPage } from "./pages/BudgetPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { SharedExpensesPage } from "./pages/SharedExpensesPage";

const rootRoute = createRootRoute({
  component: () => (
    <AuthGuard>
      <RootLayout />
    </AuthGuard>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: ExpensesPage,
});

const budgetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/budget",
  component: BudgetPage,
});

const sharedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shared",
  component: SharedExpensesPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  expensesRoute,
  budgetRoute,
  sharedRoute,
  reportsRoute,
  profileRoute,
]);
