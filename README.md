# MessMate Georgia

A student mess discovery and enquiry website for Tbilisi.

- Frontend/server: React + Vinext (Vite)
- Hosting: Cloudflare Workers
- Database and admin identity: Supabase Postgres + Supabase Auth
- No ChatGPT sign-in or OpenAI Sites runtime is required by this version.

## Local development

Use Node.js 22.13 or newer.

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

Put these values in the ignored `.dev.vars` file:

| Setting | Value |
|---|---|
| `SUPABASE_URL` | Your project's HTTPS URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable API key, or legacy anon key |
| `SUPABASE_SECRET_KEY` | Server secret API key, or legacy service-role key |
| `ADMIN_EMAIL` | The confirmed Supabase user's email allowed to administer the site |

Never put the secret key or a password into source code, a VITE_/NEXT_PUBLIC_ variable, GitHub, or a public issue. The app reads runtime keys on the server. The frontend never receives the secret key.

## Supabase setup

1. In your Supabase project, open SQL Editor and run `supabase/migrations/202609080001_messmate_enquiries.sql` once. It adds only MessMate's table and RPC; it does not modify unrelated tables.
2. Under Authentication, enable Email/password sign-in. Create your administrator user with a verified email and a strong password. Set `ADMIN_EMAIL` to that user's email.
3. Disable public signups if this Supabase project is dedicated to MessMate's admin login. Do not change a shared project's signup policy without checking other applications.
4. Copy API keys into the local `.dev.vars` file and Cloudflare secrets.
5. Start the site and visit `/admin`. Sign in with the account created in Supabase. There is no built-in password and no bypass account. Supabase controls password requirements.

The application requires a verified Supabase user with the configured email. Arbitrary user metadata and browser-provided identity headers do not confer admin access. Sessions use HttpOnly, SameSite=Strict cookies, Secure on HTTPS, expire after at most one hour, and are validated with Supabase on protected requests. Sign out clears the cookie. As with ordinary JWT sessions, an already copied access token remains usable until its expiry; use short Supabase token lifetimes if immediate revocation matters.

### Database access

Row Level Security is enabled. `anon` and `authenticated` have no table or RPC permissions. All enquiry access goes through the Worker, with admin identity verification before reads/changes. The server secret is deliberately the only database principal. The submit RPC rate-limits each email to five enquiries per hour within a transaction. Use Cloudflare rate-limiting rules for additional abuse protection on `/api/auth/login` and `/api/requests` before promoting the site widely. Supabase's own auth rate limits also apply.

## Cloudflare publishing

This is a Worker application, not a static Pages export: it needs server routes to protect admin access and database credentials.

### From your computer

```sh
npx wrangler login
npm run deploy
```

After the first deployment, add the four settings above in Workers & Pages → messmate-georgia → Settings → Variables and Secrets. Use Secret for the API keys. Add the project URL and admin email as runtime settings too. Deploy the changes. Until settings and the SQL migration are installed, forms fail with an availability error and admin login fails closed.

Or use the CLI's interactive secret prompts (values will not go in command history):

```sh
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ADMIN_EMAIL
```

Wrangler uses the generated configuration selected by `.wrangler/deploy/config.json`; do not hardcode an assumed dist directory. `npm run build` generates the Worker and assets. `npm run deploy` builds and then runs Wrangler.

### From the GitHub repository

In Cloudflare Workers & Pages, create/connect a Worker to this repository:
- Root directory: repository root
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node version: 22 or newer

Configure the four runtime values in Cloudflare. GitHub Actions runs tests and the build; it does not silently deploy or store Supabase secrets. Cloudflare's Git integration handles publishing when enabled by the owner.

## Checks

```sh
npm test
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

The test suite covers admin authorization, invalid tokens, login verification, secure cookie attributes, secret-key headers, validation and same-origin checks. Run a real end-to-end check after configuring your Supabase project: submit an enquiry, confirm it in the admin dashboard, update its status, sign out, and ensure the API denies access.

## Product status

Discovery listings, student enquiries, provider applications and admin management are implemented. Current provider menus/prices and partnerships remain unconfirmed. Orders, payment collection, automated email notifications and recurring meal management are not implemented.

## Migration note

The earlier privately hosted review used OpenAI Sites and D1. This source now runs independently on Cloudflare + Supabase. The earlier review deployment and its data were not deleted. No live enquiries were automatically moved; export/import them separately if needed. The Git history retains the previous implementation for rollback.
