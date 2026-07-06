# Deploying the CRM

Everything here assumes a fresh Ubuntu 22.04+ VPS (Hostinger, DigitalOcean, Contabo — any
provider works, 2GB RAM / 1 vCPU is plenty for this scale) and a domain you can point at it.

## White-label model: one instance per client

This app is **not** multi-tenant — every client gets their own fully isolated deployment: own
database, own domain, own Meta App, own branding. The Docker image itself is identical and
reusable across every client; only the `.env` file and the data inside each client's database
differ. That means:

- No client can ever see another client's data — there's no shared database to leak across.
- Each client connects **their own** Facebook/Instagram/WhatsApp via **their own** Meta App, so
  there's no Meta App Review process to go through.
- Branding (name, logo, colors) is configured per-instance from **Settings → Branding** in the
  app itself, or via the `ORG_*` env vars on first bootstrap — no code changes or rebuild needed
  between clients.

To onboard a new client, repeat the steps below on a fresh VPS (or a fresh Docker Compose
project on a shared VPS, if you're running several small clients on one server) with that
client's own domain, secrets, and branding values.

## 1. Point the domain at the server

In the domain registrar's DNS settings, add an **A record**:

```
Type: A
Name: crm  (or @ for the bare domain)
Value: <VPS's public IP>
```

DNS can take a few minutes to a few hours to propagate. You can start the steps below while
you wait — Caddy will just retry the SSL certificate step until DNS resolves.

## 2. Install Docker on the VPS

SSH in, then:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Clone the repo and configure environment

```bash
git clone <your-repo-url> crm
cd crm
cp .env.production.example .env
nano .env   # fill in every value — see the checklist below
```

Fill in `.env`:

- `DOMAIN` / `APP_URL` — the client's real domain, e.g. `crm.clientname.com` / `https://crm.clientname.com`
- `POSTGRES_PASSWORD` — generate one: `openssl rand -hex 24`
- `DATABASE_URL` — update the password in this string to match `POSTGRES_PASSWORD` above (host stays `db`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — generate two **different** values per client: `openssl rand -hex 32`
- `META_TOKEN_ENCRYPTION_KEY` — generate a fresh one per client: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `META_WEBHOOK_VERIFY_TOKEN` — any random string, paste into this client's Meta App webhook config later
- `META_APP_SECRET` — from this client's own Meta App dashboard, once they've created one
- `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the client's first admin login
- `ORG_NAME` / `ORG_LOGO_URL` / `ORG_PRIMARY_COLOR` / `ORG_SECONDARY_COLOR` — the client's branding (optional here — can also be set later in-app under Settings → Branding)

## 4. First deploy

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml --profile tools run --rm bootstrap
docker compose -f docker-compose.prod.yml up -d
```

- `migrate` applies the database schema.
- `bootstrap` creates the lead-status pipeline, the admin account, and the initial branding
  (reads `ADMIN_*` and `ORG_*` from `.env`).
- `up -d` starts Postgres, the app, and Caddy (which automatically requests a Let's Encrypt
  certificate for `DOMAIN` on first request — no manual SSL steps needed).

Check everything's healthy:

```bash
docker compose -f docker-compose.prod.yml ps
curl -I https://client-domain.com
```

Log in at `https://client-domain.com/login` with the admin credentials you set.

**Then remove `ADMIN_PASSWORD` (and `ADMIN_NAME`/`ADMIN_EMAIL` if you like) from `.env`** and run
`docker compose -f docker-compose.prod.yml up -d app` to refresh the app container without that
value sitting in its environment.

## 5. Subsequent deploys

Once set up, ship updates with:

```bash
./deploy.sh
```

This pulls the latest code, rebuilds, migrates, and restarts — the `bootstrap` step is
one-time only and isn't part of this script. Run this on every client's deployment when you
ship a new feature or fix — since they all run the same codebase, updates roll out the same way
everywhere.

## 6. Connect Meta (Facebook/Instagram/WhatsApp)

Now that there's a public HTTPS URL, follow the in-app instructions at
**Meta Integration** (Facebook/Instagram tab and WhatsApp tab):

1. Have the client (or you, on their behalf) create a Meta App at developers.facebook.com under
   *their own* Business Manager, and add the **Webhooks** product.
2. Subscribe to:
   - `leadgen` on the Page object, for Facebook/Instagram Lead Ads
   - `messages` on the WhatsApp Business Account object, for click-to-WhatsApp ads
   
   Both use the same values:
   - Callback URL: `https://client-domain.com/api/meta/webhook`
   - Verify Token: the `META_WEBHOOK_VERIFY_TOKEN` value from `.env`
3. Copy the App Secret into `META_APP_SECRET` in `.env`.
4. Add the **Facebook Login for Business** product (not classic Facebook Login — Business Login
   is the correct product for Page/Business-asset permissions like `leads_retrieval`). Under its
   Settings, add to **Valid OAuth Redirect URIs**:
   `https://client-domain.com/api/meta/oauth/callback` — this must exactly match the URL the app
   builds from `APP_URL`, or Facebook will reject the connection with `redirect_uri_mismatch`.
5. Under permissions/scopes for that Login for Business config, make sure these are available:
   `pages_show_list`, `pages_read_engagement`, `leads_retrieval`, `pages_manage_metadata`. (Instagram
   Lead Ads don't need a separate `instagram_basic` scope — the linked Instagram professional
   account comes through automatically via the Page's `instagram_business_account` field.) Since
   the connecting admin is an Admin/Developer/Tester on this client's own Meta App, these work
   without going through Meta App Review.
6. Copy the App ID into `META_APP_ID` in `.env` (next to `META_APP_SECRET`).
7. Add the **WhatsApp** product, then under **WhatsApp > Embedded Signup > Configurations**,
   create a Configuration (choose the business info and phone-number options you want to expose
   during signup). Copy its Configuration ID into `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` in `.env`.
8. Restart the app to pick up the new env vars: `docker compose -f docker-compose.prod.yml up -d app`.
9. In the CRM's Meta Integration page, click **Continue with Facebook** to connect Facebook
   Pages — this handles the token exchange and webhook subscription automatically, and you just
   pick which Page(s) to connect. A "paste a Page access token manually" fallback is still
   available if OAuth isn't set up yet.
10. In the WhatsApp tab, click **Continue with WhatsApp** to run Embedded Signup — a Facebook
    popup walks the client through creating/picking a WhatsApp Business Account and phone number
    (including migrating a number off the WhatsApp Business App if needed), then the CRM
    automatically exchanges the resulting code for a token, registers the number, and subscribes
    it to the webhook. If `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` isn't set yet, only the manual
    Phone Number ID / WABA ID / access token fallback is shown.

Facebook/Instagram Lead Ads can also be pulled manually with **Sync Now**, without a webhook.
**WhatsApp has no manual fallback** — leads only arrive once the webhook is live.

## Operations cheat sheet

```bash
# Tail app logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart just the app (e.g. after editing .env)
docker compose -f docker-compose.prod.yml up -d app

# Back up the database
docker compose -f docker-compose.prod.yml exec db pg_dump -U crm_app crm > backup-$(date +%F).sql

# Restore a backup
cat backup-2026-07-01.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U crm_app crm

# Shell into the database
docker compose -f docker-compose.prod.yml exec db psql -U crm_app crm
```

## What's protected vs. exposed

- Only Caddy binds host ports (80/443). Postgres and the app are on an internal Docker
  network with no direct host exposure.
- Caddy handles HTTPS termination and certificate renewal automatically.
- Security headers (HSTS, X-Frame-Options, etc.) are set in the `Caddyfile`.
- Each client's database, secrets, and Meta credentials are fully separate from every other
  client's — there is no shared state between deployments.
