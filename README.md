# Pananames Playwright Tests

A focused Playwright and TypeScript test project for Pananames contact management and domain-cart workflows.

## Automated coverage

- Create a contact and verify its persisted values.
- Edit a disposable contact and verify changed fields.
- Verify contact checkbox persistence.
- Delete a disposable contact through the UI.
- Verify a single-domain cart total for `.com`, `.net`, and `.org` using parameterized tests.
- Search by SLD, add exactly three available domains, and verify the cart total equals their summed prices.

Each contact test creates its own unique data and performs best-effort cleanup. Domain tests clear the shared cart before and after each scenario. The protected `primary` and `abuse` contacts are never used as disposable test data.

## Requirements

- Node.js 20.19 or later
- npm (included with Node.js)

## Installation

```bash
npm ci
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

# Open Playwright Inspector for debugging
npm run test:debug

# Static validation
npm run typecheck
npm run lint
npm run format:check

# Apply project formatting
npm run format
```

## Docker

The Docker image provides a consistent Node.js, Chromium, and system-library environment. It uses the Playwright image version that matches the version installed by `package-lock.json`.

Create `.env` as described above, then build and run the suite with Docker Compose:

```bash
docker compose build
docker compose run --rm tests
```

The Compose service loads credentials from the local `.env` file and writes Playwright reports and test results to the corresponding host directories. Neither the credentials nor the generated authentication state are copied into the image.

To build and run without Compose:

```bash
docker build -t pananames-playwright-tests .
docker run --rm --ipc=host --env-file .env \
  -v "${PWD}/playwright-report:/app/playwright-report" \
  -v "${PWD}/test-results:/app/test-results" \
  pananames-playwright-tests
```

## Project structure

```text
pages/                    Page objects for login, contacts, registration, and cart
fixtures/test.ts          Typed fixtures for reusable page-object initialization
tests/auth.setup.ts       One-time UI login and storage-state creation
tests/contacts.spec.ts    Independent create, edit, and delete scenarios
tests/single-domain.spec.ts
tests/multiple-domains.spec.ts
utils/money.ts            USD display parsing into integer cents
utils/testData.ts         Unique disposable contact and DNS-safe domain data
playwright.config.ts      Authentication dependency and Chromium configuration
Dockerfile                Reproducible Playwright execution image
compose.yaml              Credentials and artifact mounts for Docker execution
.github/workflows/        Automatic static checks and manually triggered E2E
```

## Continuous integration

`quality.yml` runs `npm ci`, TypeScript, ESLint, and Prettier checks for pull requests and pushes to `main`. It does not access the dev application.

`e2e-manual.yml` runs the Playwright suite only when started manually through **Actions → Manual E2E → Run workflow**. Before using it, configure the repository secrets `PANANAMES_EMAIL` and `PANANAMES_PASSWORD`.

## Design decisions

- Page Object Model classes contain locators and page actions; business assertions remain in tests.
- Typed Playwright fixtures initialize only the page objects each scenario needs.
- A setup project logs in once through the UI and saves reusable `storageState`.
- Contact scenarios own their setup and cleanup, so they can run independently and in any order.
- Displayed prices are converted to integer cents; promotional and multi-year displays use the effective selected-period amount.
- Single-domain coverage is data-driven across three supported TLDs rather than duplicated.
- Execution uses one worker because the supplied account is shared and cart state may be account-scoped. Tests remain logically independent despite sequential execution.
- Docker provides a reproducible Node.js, Chromium, and system-library environment without replacing the local workflow.
- CI runs static checks automatically; E2E execution against the shared dev environment remains manually triggered.
- Chromium is the only configured browser because cross-browser coverage was not requested.
- Screenshots and videos are retained on failure, while traces are captured on the first retry.
