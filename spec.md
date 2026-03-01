# Student Budget Tracker & Financial Intelligence System

## Current State
New project. No existing backend or frontend code.

## Requested Changes (Diff)

### Add
**User Authentication**
- User registration and login with hashed passwords
- JWT-like session management via Internet Computer auth
- Protected routes for authenticated users

**User Profile & Financial Survey**
- Demographic fields: age, gender, course/stream, living situation
- Income info: source, income range
- Financial habits survey: expense tracking behavior, budgeting habits, stress level (1-5), emergency savings, shared expenses behavior, feature preferences, biggest financial problem

**Expense Management**
- Add, edit, delete expenses
- Expense fields: amount, category, date, note
- Filter by date, category, month
- Predefined categories: Food, Transport, Books, Entertainment, Shopping, Rent, Miscellaneous
- Custom category creation

**Budget Management**
- Set monthly budget limits per category
- Track total spent, remaining balance, percentage used
- Income vs expense comparison

**Intelligent Alert System**
- 75% budget usage warning
- 90% critical alert
- 100% exceeded alert
- Repeated overspending detection
- Corrective action suggestions

**Financial Intelligence Engine**
- Compute: income-to-expense ratio, highest spending category, monthly trends, financial stress correlation, borrowing risk, discipline level
- Financial Score (0-100) based on: overspending, budget discipline, emergency savings, income management, stress level
- Personalized saving tips, weekly spending cap suggestions, emergency fund recommendations

**Shared Expense Module**
- Create groups, add/remove members
- Add shared expenses with equal or custom splits
- Track paid/pending status
- Generate settlement summaries (who pays whom)

**Dashboard & Analytics**
- Pie chart: category distribution
- Bar chart: monthly comparison
- Line graph: spending trend
- Budget utilization progress bars
- Income vs expense comparison
- Financial score meter (0-100)

**Reporting**
- Monthly summary report
- Improvement trends
- Behavioral insights

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

**Backend (Motoko)**
1. User data store: profile, demographic info, survey answers
2. Expenses store: CRUD operations with filtering
3. Categories store: predefined + custom categories
4. Budgets store: monthly limits per category, usage tracking
5. Shared groups store: group CRUD, members management
6. Shared expenses store: expenses with split logic, settlements
7. Analytics queries: aggregations for charts and financial score computation
8. Alert logic: threshold checks on budget usage

**Frontend (React + TypeScript)**
1. Auth pages: login, register
2. Onboarding survey: multi-step financial profile form
3. Dashboard: charts (pie, bar, line), financial score meter, budget utilization
4. Expenses page: list, add/edit/delete form, filters
5. Budget page: category budget setup and tracking
6. Shared expenses page: groups, add expense, split view, settlement summary
7. Reports page: monthly summary, trends, insights
8. Alert notifications: toast/banner alerts for budget thresholds
9. Navigation: sidebar with all sections
