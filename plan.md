## Plan: Full Reference ERP Rebuild

Rebuild the Rice Link portal around the supplied reference application’s complete operational structure. The reference app is the product specification for navigation, terminology, page composition, status filters, forms, KPIs, and workflows. The existing QA, Paddy Lot, Production Output, Mills, Templates, Users, and Finance implementation is legacy: migrate useful data/behavior into the new structure, then retire duplicate old navigation and logic after each replacement module is verified.

**Discovery findings**

Reference shell and login:
- Public landing page: Azhar Foods / Rice Mill ERP System.
- Login fields: Username, Password, Sign In.
- Demo roles shown: Admin, Manager, Accountant, Storekeeper.
- Reference deployment states that data is stored locally in the browser.
- Our portal uses email/password, PostgreSQL, Prisma, and different role names; authentication must be adapted to the reference role model while preserving secure server-side authorization.

Reference navigation:
- Dashboard
- Purchases
- Production
- Sales
- Dispatch
- Stock
- Products
- Customers
- Suppliers
- Godowns
- Expenses
- Accounting
- Reports
- Company Profile

Reference dashboard:
- Quick actions: New Purchase, New Sale, New Production, New Dispatch, Add Customer, Add Supplier, Add Expense.
- KPI cards: Today’s Sales, Today’s Purchases, Today’s Production, Current Stock Value, Customer Receivables, Supplier Payables, Today’s Expenses, Today’s Profit.
- Sales vs Purchases chart for the last 7 days.
- Monthly Profit current month and last six months.
- Recent production batches.
- Stock Summary table with product, current stock, value, and low-stock status.
- Must become the first screen and the primary operational overview, replacing the current production-only dashboard.

Reference page conventions:
- Every module has a clear heading and date/context.
- Each list has one obvious primary action.
- Status tabs/filters are used for operational documents.
- Tables show business identifiers, parties, amounts/quantities, status, and actions.
- Empty states explain what the user should do next.
- Create/edit flows use dedicated pages or clear side panels.
- Existing old routes should not remain the primary navigation.

**Implementation sequence**

### Phase 0: Freeze and map legacy behavior
1. Snapshot current routes, actions, schema models, seed data, and permissions.
2. Mark current modules as legacy: Paddy Lots, Quality Control, Report Entries, QA Dashboard, Mills, Report Templates, existing Finance subsections, and current Production Output.
3. Define data migration adapters before deleting or changing old logic.
4. Preserve only reusable domain calculations, validation rules, PDF generation, and audit-relevant QA data.
5. Do not delete legacy database tables until replacement modules have migration coverage and verified end-to-end behavior.

### Phase 1: Replace the application shell and Dashboard
1. Replace the sidebar with the exact reference module order and terminology.
2. Update authentication presentation to Username/Password and map roles to Admin, Manager, Accountant, and Storekeeper, while retaining secure internal permissions.
3. Build the Dashboard as the first product screen with:
   - eight operational KPI cards;
   - quick-create actions;
   - seven-day Sales vs Purchases chart;
   - current and six-month profit charts;
   - recent production batches;
   - stock summary with low-stock indicators.
4. Remove production-only dashboard messaging and synthetic quality metrics from the primary dashboard.
5. Add a consistent page header, date context, action placement, loading/empty/error states, and responsive sidebar behavior.
6. Verification: login by each role, route visibility, KPI calculations from real records, empty database state, and mobile/desktop layout.

### Phase 2: Products, Customers, Suppliers, and Godowns
1. Products:
   - product name, SKU, type, category, unit, QA requirement, active status;
   - types: Raw Material, Finished Good, By-product, Packaging;
   - create, edit, activate/deactivate, search, and detail/history views.
2. Customers:
   - name, contact person, phone, email, address, active status;
   - create/edit/deactivate, balance, sales history, and detail view.
3. Suppliers:
   - name, contact person, phone, email, address, active status;
   - create/edit/deactivate, purchase history, payable balance, and detail view.
4. Godowns:
   - name, location, capacity, unit, active status;
   - create/edit/deactivate, stock-by-location view, capacity usage, and movement history.
5. Categories and units become real master-data maintenance screens rather than seed-only dependencies.
6. Migrate legacy free-text supplier and variety fields to canonical records without losing original values.
7. Verification: create/edit/deactivate each master record and confirm selectors throughout the system use active records only.

### Phase 3: Purchases and Receiving
1. Purchase list with reference tabs: All, Unpaid, Partial, Paid.
2. Purchase document with:
   - purchase number;
   - date;
   - supplier;
   - godown;
   - one or more product lines;
   - quantity, unit, rate, line total;
   - paid amount, remaining amount, payment method;
   - notes and attachments if required.
3. Purchase detail, edit, payment update, print/export, and receiving history.
4. Receiving workflow creates stock-in movements and traceable batch/paddy-lot records.
5. Support partial receiving and prevent received quantity from exceeding ordered quantity.
6. Replace the old direct Paddy Lot creation entry point with purchase receiving, while keeping a compatibility route for historical lots.
7. Verification: unpaid/partial/paid status transitions, supplier balance, stock increase, lot traceability, and duplicate-safe document numbering.

### Phase 4: Production
1. Production list with tabs: All, Draft, In Progress, Completed, Cancelled.
2. Production batch document with:
   - batch number/date;
   - source godown and destination godown;
   - one or more paddy/product inputs;
   - input quantities and batch/lot allocation;
   - output product lines for rice, broken rice, husk, bran/polish, waste, and shortage;
   - labor, electricity, drying, packing, transport, loading, and other costs;
   - yield/recovery calculations;
   - status transitions.
3. Consume input stock and post output stock transactionally.
4. Convert fixed legacy `ProductionOutput` columns into product-linked output lines through a compatibility adapter.
5. Integrate QA templates and QA approval for products/lots marked as requiring QA.
6. Preserve production PDFs, make company profile data drive headers, and keep one-page output.
7. Verification: multiple inputs, multiple outputs, insufficient stock, status transitions, cost/yield math, QA gating, and idempotent stock posting.

### Phase 5: Sales
1. Sales list with tabs: All, Unpaid, Partial, Paid.
2. Sales invoice creation with:
   - invoice number/date;
   - customer;
   - product lines;
   - available stock/batch allocation;
   - quantity, rate, discount/tax policy if enabled, line total;
   - received amount, remaining balance, payment method;
   - notes.
3. Sales detail/edit/payment update and printable invoice.
4. Customer balance and sales history.
5. Prevent selling unavailable stock and preserve partial fulfillment quantities.
6. Verification: invoice totals, payment status, stock reservation/allocation, customer receivable, and edit restrictions after dispatch.

### Phase 6: Dispatch
1. Dispatch list with Pending, Partial, Delivered, and Cancelled states.
2. Dispatch creation from a sales invoice with:
   - dispatch number/date;
   - customer and invoice reference;
   - source godown;
   - dispatch line quantities;
   - vehicle/driver/delivery notes if supported by the reference workflow.
3. Support partial dispatch and update `dispatchedQty` on invoice lines.
4. Post stock-out movements transactionally only on confirmation/delivery according to the chosen rule.
5. Add dispatch detail, delivery confirmation, print/export, and audit history.
6. Verification: over-dispatch prevention, stock deduction, invoice fulfillment status, cancellation safety, and delivery status transitions.

### Phase 7: Stock
1. Product stock summary with current quantity, unit, weighted-average value, and low-stock status.
2. Godown stock summary with used quantity, capacity, utilization, and near-capacity warning.
3. Stock movement ledger with date, product, godown, source document, quantity in/out, cost, and batch.
4. Add manual adjustment and godown transfer workflows with reason and authorization.
5. Add stock valuation, stock movement, godown stock, and batch stock reports.
6. Enforce no negative stock through transactional checks.
7. Verification: purchase in, production consume/output, dispatch out, transfer, adjustment, valuation, and reconciliation against source documents.

### Phase 8: Expenses and Operational Finance
1. Promote Expenses to a top-level reference module while preserving the existing finance implementation underneath.
2. Match reference expense features:
   - KPI cards: total, count, average, top category;
   - search and category filters;
   - transaction/date/category/vendor/amount/payment method columns;
   - create/edit/soft-delete;
   - employee and paddy-lot links;
   - attachment URL and notes;
   - payment methods.
3. Keep Income, Categories, Employees, Salaries, Budgets, and Finance Reports available under Accounting.
4. Connect purchase payments, sales receipts, expenses, salaries, supplier payables, and customer receivables.
5. Keep current lot finance posting idempotent while replacing it with document-driven postings.
6. Verification: monthly totals, soft-delete behavior, payroll calculation, budget utilization, and source-document links.

### Phase 9: Accounting
1. First reproduce the reference’s operational accounting experience:
   - Finance Overview;
   - Income;
   - Expenses;
   - Categories;
   - Employees;
   - Salaries;
   - Budgets;
   - Finance Reports.
2. Add reference finance filters, KPIs, P&L, budget-vs-actual, salary summary, lot profitability, and CSV exports.
3. After operational flows stabilize, add full double-entry models:
   - Chart of Accounts;
   - Account Groups;
   - Fiscal Periods;
   - Journal Entries/Lines;
   - Payments;
   - Posting status and audit history.
4. Define postings for purchases, stock, production, sales, dispatch, expenses, salaries, payments, and returns.
5. Verification: balanced journals, trial balance, P&L, balance sheet, cash/bank book, receivables, and payables.

### Phase 10: Reports
1. Build a reference-style Reports hub with grouped report cards/tabs.
2. Stock reports:
   - Current Stock;
   - Stock Movement;
   - Godown Stock;
   - Stock Valuation.
3. Purchase reports:
   - Purchase Summary;
   - Supplier Purchases;
   - Purchase Payments.
4. Production reports:
   - Production Summary;
   - Raw Material Consumption;
   - Yield;
   - Wastage;
   - By-product;
   - Production Cost.
5. Sales/dispatch reports:
   - Sales Summary;
   - Customer Sales;
   - Product Sales;
   - Dispatch Summary;
   - Pending/Delivered Dispatch;
   - Customer Payments.
6. Finance reports:
   - Supplier Payments;
   - Cash Book;
   - Bank Book;
   - Customers Who Owe Us;
   - Suppliers We Owe;
   - P&L and budget reports.
7. Keep QA reports as a quality subsection, linked to production lots and release status.
8. Add print and CSV export where present in the reference workflow.
9. Verification: filter/date correctness, totals against source modules, export contents, and permission restrictions.

### Phase 11: Company Profile and document identity
1. Complete Company Profile with company name, legal name, business type, phone, email, city, address, country, currency, logo, tax identifiers if required, numbering preferences, and default godown.
2. Use profile data in invoices, purchase documents, dispatch documents, reports, and production/QA PDFs.
3. Remove hard-coded legacy document identity such as “Rice Mill Lab” after replacement documents are verified.
4. Verification: save/reload profile and confirm every document header reflects it.

### Phase 12: Legacy retirement
1. Redirect old primary routes to the new reference modules:
   - old lot entry → Purchases/Receiving;
   - old production output → Production Batch detail;
   - old report entries → Reports/QA;
   - old finance pages → Expenses/Accounting.
2. Keep read-only compatibility views for historical records where migration is incomplete.
3. Remove obsolete duplicate UI and dead actions only after route-level and data-level verification.
4. Remove synthetic dashboard metrics and old sidebar terminology.
5. Verify no legacy route is still required by a new workflow.

**Data/model changes**
- Keep PostgreSQL/Prisma; do not replace the database with browser localStorage.
- Add document-number sequences rather than timestamp/random identifiers.
- Use Prisma Decimal for quantities, rates, money, costs, and balances.
- Add explicit status enums for purchase, production, sales, dispatch, payment, and stock operations.
- Add batch/lot references to stock movements, production inputs/outputs, sales allocations, and dispatch lines.
- Add audit fields/history for status changes, approvals, postings, transfers, adjustments, and deletes.
- Preserve legacy `PaddyLot`, `ProductionOutput`, `Income`, `Expense`, `Salary`, and QA records through migration adapters.
- Do not physically delete legacy tables until all data has a replacement or read-only compatibility path.

**Repository areas to replace or extend**
- `app/dashboard/page.tsx` — reference dashboard.
- `components/layout/Sidebar.tsx`, `Header.tsx`, `app/dashboard/layout.tsx` — reference shell.
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` — target ERP model and migration.
- New module routes: `app/dashboard/{purchases,production,sales,dispatch,stock,products,customers,suppliers,godowns,expenses,accounting,reports,company}/`.
- New actions: `actions/{dashboard,purchases,production,sales,dispatch,stock,products,customers,suppliers,godowns,expenses,accounting,reports,companyProfile}.ts`.
- Legacy adapters: `actions/paddyLots.ts`, `actions/production.ts`, `actions/reports.ts`, `actions/qa.ts`, `actions/finance/*`.
- Existing PDF and calculation libraries should be reused only where they match the new workflow.

**Verification gates**
1. After each phase: Prisma validate/generate, focused action checks, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
2. Browser verification of every reference module at desktop and mobile widths.
3. End-to-end workflow: supplier → purchase → receive → stock → production → QA → finished stock → sales invoice → dispatch → payment → reports.
4. Role verification for Admin, Manager, Accountant, and Storekeeper mappings.
5. Legacy-data migration verification with counts and spot-checks for lots, outputs, QA reports, finance records, and users.
6. Final route audit confirms the reference modules are primary and old duplicate routes are redirected/retired.

**Scope decisions**
- Implement the reference portal’s complete information architecture and business behavior, not a partial extension of the old portal.
- Use Rice Link branding and original code; do not copy the reference site’s source code, branding, demo data, or localStorage implementation.
- Start implementation with the Dashboard and shell, then proceed strictly module by module in the navigation order above.
- No further feature implementation should begin until this discovery plan is approved.