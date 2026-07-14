# Rice Mill Lab and Production System - Implementation Plan

This document records the development plan and the milestones implemented so far for the system.

## 1. Project goal
Build a production and quality management system for a rice mill that helps the owner monitor:
- paddy intake
- production output
- quality performance
- yield ratio
- profit and loss

## 2. Core modules planned
1. Mill management
2. Paddy lot management
3. Production output entry
4. Quality assurance and reporting
5. Dashboard for owners and managers
6. User and role management

## 3. Implementation milestones

### Milestone 1 - Core data structure
- Defined Prisma models for users, mills, paddy lots, production output, reports, and templates.
- Added role-based access for admin, analyst, QA, and mill owner.

### Milestone 2 - Lot and mill management
- Created pages and forms to add, edit, and view mills and paddy lots.
- Enabled lot tracking with supplier, variety, moisture, weight, and status.

### Milestone 3 - Production output workflow
- Added production output forms to capture rice output, cost details, and sale rates.
- Connected production output to each paddy lot.

### Milestone 4 - QA and reporting
- Built report templates and QA submission workflow.
- Added approval, rejection, and return handling for QA reports.

### Milestone 5 - Dashboard implementation
- Created an owner-focused dashboard with summary cards.
- Added views for:
  - total production
  - quality score
  - yield ratio
  - profit/loss
- Added supporting sections for:
  - monthly trend
  - supplier comparison
  - variety breakdown
  - recent lots

## 4. Implemented dashboard features
- KPI cards for core business metrics
- Clickable cards to switch the highlighted focus view
- Summary charts and simple progress bars for comparisons
- Data pull from paddy lots and production output records

## 5. Next planned improvements
- Add a real charting library for richer visual analytics
- Add date-range filters
- Add drill-down pages for each KPI
- Add cost breakdown and margin analysis
- Add export options for owner reports

## 6. Files involved in the dashboard implementation
- app/dashboard/page.tsx
- actions/dashboard.ts
- components/dashboard/OwnerDashboard.tsx

## 7. Notes
The system is now moving from basic CRUD pages toward an executive dashboard experience for owners and managers.
