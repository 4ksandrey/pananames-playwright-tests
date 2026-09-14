# Pananames Playwright Tests

A focused Playwright and TypeScript test project for Pananames contact management and domain-cart workflows.

## Coverage

- Create a contact and verify its persisted values.
- Edit a disposable contact and verify changed fields and checkbox states.
- Delete a disposable contact through the UI.
- Verify a single-domain cart total for `.com`, `.net`, and `.org` using parameterized tests.
- Search by SLD, add exactly three available domains, and verify the cart total equals their summed prices.

Each contact test creates its own unique data and performs best-effort cleanup. Domain tests clear the shared cart before and after each scenario. The protected `primary` and `abuse` contacts are never used as disposable test data.

## Requirements

- Node.js 20 or later
- npm

## Installation

```bash
npm install
npx playwright install chromium
```

## Environment variables

Create a local environment file from the safe template:

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

Set the credentials supplied for the test account in `.env`:

```dotenv
PANANAMES_EMAIL=
PANANAMES_PASSWORD=
```

Playwright loads `.env` through `dotenv`. The file and generated authentication state are ignored by Git.

## Running tests

```bash
# All scenarios
npm test

# Contacts only
npm run test:contacts

# Domain-cart scenarios only
npm run test:domains

# All scenarios in a visible browser
npm run test:headed

# Static TypeScript validation
npm run typecheck
```

## Project structure

```text
pages/                    Page objects for login, contacts, registration, and cart
tests/auth.setup.ts       One-time UI login and storage-state creation
tests/contacts.spec.ts    Independent create, edit, and delete scenarios
tests/single-domain.spec.ts
tests/multiple-domains.spec.ts
utils/money.ts            USD display parsing into integer cents
utils/testData.ts         Unique disposable contact and DNS-safe domain data
playwright.config.ts      Authentication dependency and Chromium configuration
```

## Design decisions

- A setup project logs in once through the UI and saves reusable `storageState`.
- Page objects contain locators and page actions; business assertions remain in tests.
- Contact scenarios own their setup and cleanup, so they can run independently and in any order.
- Displayed prices are converted to integer cents; promotional and multi-year displays use the effective selected-period amount.
- Single-domain coverage is data-driven across three supported TLDs rather than duplicated.
- Execution uses one worker because the supplied account is shared and cart state may be account-scoped. Tests remain logically independent despite sequential execution.
- Chromium is the only configured browser because cross-browser coverage was not requested.
