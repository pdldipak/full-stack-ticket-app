# Event ticketing system

Full-stack ticketing for **NRNA NCC Sweden**.

## Event text (single file)

Edit `frontend/src/config/eventConfig.js` (organizer/title, schedule/venues, and the order-page intro).

## Quick start

### Docker (recommended: full stack)

```bash
cp docker-compose.env.example .env
docker compose up --build
```

Open `http://localhost` (or `http://localhost:WEB_PORT` if you changed `WEB_PORT`).

### Local dev (MySQL in Docker, apps with `npm`)

1) Start only MySQL:

```bash
docker compose up db
```

2) Configure backend:

```bash
cd backend
cp .env.example .env
```

In `backend/.env` set:
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER/DB_PASSWORD/DB_NAME` to match root `.env`
- `SELLER_USERNAMES` / `SELLER_PASSWORDS` (required for the public order page)
- `SCANNER_USERNAMES` / `SCANNER_PASSWORDS` (required for scanner logins)

3) Run backend + frontend:

```bash
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

Open `http://localhost:5173` (Vite proxies API calls to `3001` via `vite.config.js`).

## Sellers (public order page)

The order page loads sellers from `GET /public/sellers`.

Sellers are configured via `backend/.env`:
- `SELLER_USERNAMES` (comma-separated)
- `SELLER_PASSWORDS` (comma-separated; same count/order)

## Ticket codes (TKT-…)

Legacy (default): `TKT-{id}` (e.g. `TKT-0001`).

Configured format (new): `TKT-{slug}-{id}` e.g. `TKT-NY-2083-0001`.

Enable by setting **`TICKET_CODE_EVENT_SLUG`**:
- local dev: `backend/.env`
- Docker/Compose: root `.env` (the same file used by `docker-compose.yml`)

Existing tickets keep their original `ticket_code` unless you run a rewrite migration.

## Legacy DB migration (optional)

Older DBs created before newer columns existed may need:

```bash
sed 's/\r$//' migrations/001_tickets_legacy_upgrade.sql \
  | docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

## Event ticketing system
 
Full-stack ticketing for **NRNA NCC Sweden**.

## Event text (single file)

Edit `frontend/src/config/eventConfig.js` (organizer/title, schedule/venues, and the order-page intro).

## Quick start

### Docker (recommended: full stack)

```bash
cp docker-compose.env.example .env
docker compose up --build
```

Open `http://localhost` (or `http://localhost:WEB_PORT`).

### Local dev (MySQL in Docker, apps with `npm`)

1) Start only MySQL:

```bash
docker compose up db
```

2) Configure backend:

```bash
cd backend
cp .env.example .env
```

Set in `backend/.env`:
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER/DB_PASSWORD/DB_NAME` to match your root `.env`
- `SELLER_USERNAMES` / `SELLER_PASSWORDS` (required for the public order page)
- `SCANNER_USERNAMES` / `SCANNER_PASSWORDS` (required for scanner logins)

3) Run:

```bash
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

Open `http://localhost:5173`.

## Sellers (public order page)

The order page loads sellers from `GET /public/sellers`. Sellers are configured only via `backend/.env`:
- `SELLER_USERNAMES` (comma-separated)
- `SELLER_PASSWORDS` (comma-separated; same count/order)

## Ticket codes (TKT-...)

Legacy (default): `TKT-0001`, `TKT-0002`, ...

Configured format (new): `TKT-{slug}-{id}` e.g. `TKT-NY-2083-0001`

Enable by setting **`TICKET_CODE_EVENT_SLUG`**:
- local dev: `backend/.env`
- Docker/Compose: root `.env` (the same file used by `docker-compose.yml`)

Frontend scanner placeholder uses `frontend/src/config/eventConfig.js` and must match the API slug.

Existing tickets keep their original `ticket_code` unless you run a rewrite migration.

## Legacy DB migration (optional)

If your DB was created before newer columns existed, run (from repo root):

```bash
sed 's/\r$//' migrations/001_tickets_legacy_upgrade.sql | docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```


- **Node.js** 18+ (only for local dev without Docker)
- **MySQL** 8.x (or compatible), **unless** you use Docker (MySQL is included in Compose)

### I donâ€™t have MySQL on my computer

You do **not** need to install MySQL locally if you use **Docker**. The database runs inside a container; your PC only needs [Docker Desktop](https://docs.docker.com/desktop/) (Windows / Mac) or Docker Engine + Compose on Linux.

**Option A â€” Everything in Docker (simplest)**  
You only install Docker. Then from the project root:

```bash
cp docker-compose.env.example .env
docker compose up --build
```

Open **http://localhost** and sign in. MySQL, the API, and the web app all run in Docker; nothing is installed on the host except Docker.

**Option B â€” MySQL in Docker, app with `npm` (for local development)**  
Start **only** the database container, then run the backend and frontend on your machine:

```bash
docker compose up db
```

Wait until MySQL is healthy. In `backend/.env` (copy from `backend/.env.example`), set:

- `DB_HOST=127.0.0.1` or `localhost`
- `DB_PORT=3306` (or the same value as `MYSQL_PORT` in `.env` if you changed it)
- `DB_USER`, `DB_PASSWORD`, `DB_NAME` â€” match `docker-compose.env.example` / your root `.env` (`tickets`, `ticketspass`, `event_tickets` by default)
- `SELLER_USERNAMES`, `SELLER_PASSWORDS`, `SCANNER_USERNAMES`, `SCANNER_PASSWORDS` â€” see **Sellers** / **Door staff** below (required for logins; replace placeholders in `.env.example`)

Run the API (`cd backend && npm install && npm run dev`) and the UI (`cd frontend && npm install && npm run dev`). Use **http://localhost:5173**; the Vite dev server proxies API calls to port 3001.

If you **cannot** use Docker, you would need either a cloud MySQL instance (connection string in `backend/.env`) or a local install such as [XAMPP](https://www.apachefriends.org/) / MariaDB â€” Docker is usually easier on Windows.

### WSL (Windows)

Use **WSL2** and run all commands from your Linux distroâ€™s terminal (Ubuntu, etc.).

1. **Docker**  
   Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) and turn on **Settings â†’ Resources â†’ WSL integration** for your distro. Then `docker` and `docker compose` work inside WSL without installing Docker Engine separately.

2. **Project path**  
   Your repo can live under `/mnt/c/Users/...` (slower I/O) or under your WSL home, e.g. `~/code/nrna-ncc-ticket` (often faster). From WSL:

   ```bash
   cd ~/path/to/nrna-ncc-ticket
   cp docker-compose.env.example .env
   docker compose up --build
   ```

3. **Browser**  
   Open **http://localhost** (or **http://localhost:<WEB_PORT>**) in **Chrome or Edge on Windows**. `localhost` is shared between WSL and Windows for published ports.

4. **Option B** (`docker compose up db` + `npm run dev`)  
   Install **Node.js in WSL** (e.g. [nvm](https://github.com/nvm-sh/nvm)) so `node`/`npm` are not the Windows versions. Use `127.0.0.1` for `DB_HOST` in `backend/.env`.

## Docker (recommended for a full stack)

Requires [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/).

1. Copy the example env file and fill **every required** variable (MySQL, `JWT_SECRET`, seller/scanner logins):

   ```bash
   cp docker-compose.env.example .env
   ```

   `docker-compose.yml` does **not** embed real passwords; Compose fails fast if a required key is missing. Set `CORS_ORIGIN` to the exact URL you will open in the browser (include the port if it is not 80), for example `http://localhost` or `http://localhost:8080` if `WEB_PORT=8080`.

2. Build and start MySQL, API, and web (nginx serves the React app and proxies `/auth`, `/tickets`, and `/health` to the API):

   ```bash
   docker compose up --build
   ```

3. Open **http://localhost** (or `http://localhost:<WEB_PORT>`). Log in with a seller account (see below).

The first run creates a persistent MySQL volume (`db_data`) and applies `docker/mysql/init.sql`. To reset the database completely:

```bash
docker compose down -v
docker compose up --build
```

**Services**

| Service | Role |
|--------|------|
| `db` | MySQL 8, port `3306` on the host by default (`MYSQL_PORT`) |
| `api` | Express API (internal port 3001; not published by default) |
| `web` | Nginx + static build; proxies API routes so the browser uses one origin |

The frontend is built with an empty `VITE_API_URL` so Axios calls `/auth` and `/tickets` on the same host as the UI; nginx forwards those to the API container.

## 1. Database setup

Create the schema and table (from the project root):

```bash
mysql -u root -p < schema.sql
```

Or open `schema.sql` in your MySQL client and run it.

## 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (use a long random string in production)
- Optional: `CORS_ORIGIN` (e.g. `http://localhost:5173`) if you call the API from a different host without the Vite proxy

Install and run:

```bash
npm install
npm run dev
```

API default: **http://localhost:3001**  
Health check: `GET http://localhost:3001/health`

### Sellers

Configure accounts only in **`backend/.env`** (or Docker env for the API):

- **`SELLER_USERNAMES`** â€” comma-separated usernames (e.g. `seller1,seller2,seller3,seller4`).
- **`SELLER_PASSWORDS`** â€” comma-separated passwords, **same count and order** as usernames.

There are **no default passwords in code**. Each username must exist as a key in `backend/src/config/sellerCities.js` (`SELLER_ALLOWED_CITIES`) or city checks will not match. Do not put commas inside passwords (use strong passwords without commas). Do not commit `.env`.

The entrypoint imports `src/loadEnv.js` **first**, so `backend/.env` is loaded before `sellers.js` runs; otherwise the public order page would show **no sellers** even with a correct `.env` file.

For normal sellers, edit and delete are allowed **only** for tickets **you created** (`sold by` = your username), and **not** after check-in. A configured **admin** may **edit or delete any ticket** (including after check-in), use **any program city**, and **attribute sales** to a seller account. The API enforces city access per seller (`sellerCities.js`) for non-admin users and when crediting a ticket to a named seller.

Login and `GET /auth/me` return **`allowedCities`** for the UI dropdown. For admins, responses also include **`sellerUsernames`** (configured seller logins) for the create/edit UI.

### Master admin (optional)

Set **`ADMIN_USERNAME`** and **`ADMIN_PASSWORD`** in `backend/.env` (or Docker Compose env for the `api` service). Sign in on the **same** page as sellers (`/login`). The JWT role is **`admin`**.

- **Sell**: create tickets like a seller; optional **`soldBy`** on `POST /tickets` credits the sale to a configured seller (must be allowed for the chosen city). Omit `soldBy` to record under the admin username.
- **Edit/delete any ticket**, including **checked-in** tickets.
- **Reassign** **`sold_by`** on update (`PUT /tickets/:code`) to a seller or the admin username.
- **City**: any program city on create/edit; attributed sellers must still be allowed for that city.

If either env variable is missing or empty, admin login is **disabled**. In **production**, if you set one of `ADMIN_USERNAME` / `ADMIN_PASSWORD` you must set both. Do not pick an `ADMIN_USERNAME` that matches any configured seller or scanner username.

### Door staff (scanner only)

Accounts are **only** from the environment:

- **`SCANNER_USERNAMES`** â€” comma-separated usernames.
- **`SCANNER_PASSWORDS`** â€” comma-separated passwords, **same count and order**.

Sign in at **`/scanner-login`**. Scanners may call **`POST /tickets/checkin`** (and session) only. No hardcoded scanner passwords in code.

**Sellers** sign in at **`/login`**; **door staff** sign in at **`/scanner-login`**. Seller JWTs cannot call check-in; scanner JWTs cannot list or mutate tickets.

## 3. Frontend

```bash
cd frontend
cp .env.example .env
```

Login pages use a full-screen hero image: `frontend/public/event-login-bg.png` (served as `/event-login-bg.png`). Replace that file to change artwork; keep the filename or edit `frontend/src/components/common/LoginPageBackground.jsx`.

For **local development**, leave `VITE_API_URL` empty so the Vite dev server proxies `/auth` and `/tickets` to the API (see `vite.config.js`).

```bash
npm install
npm run dev
```

**Hot reload (Vite HMR)** only runs when you use `npm run dev` in `frontend`. **`docker compose up`** builds the app once and **nginx** serves the static `dist` folder â€” there is **no** dev server, so saving files will not live-reload the browser until you rebuild the `web` image. For fast UI work, run the Vite dev server on your machine (API can stay in Docker: `docker compose up db api`).

Open **http://localhost:5173**. **Sellers** use **Sign in** â€” create tickets, browse the list, open detail for the QR image. **Door staff** use **Door staff scanner sign-in** (`/scanner-login`) â€” **Scanner** only, for check-in.

For **production** builds:

- **Docker (nginx + API proxy)**: keep `VITE_API_URL` empty so the browser calls `/auth` and `/tickets` on the same origin (see `frontend/nginx.conf`).
- **Separate API host**: set `VITE_API_URL=https://api.example.com` and set `CORS_ORIGIN` on the API to your site origin.

## Production deployment

### Keeping passwords and env out of the repo

- **Never commit** real `.env` files. The repo ignores `.env` in the root and in subfolders (see `.gitignore`). Only `*.env.example` files belong in git, with **placeholders** â€” not real passwords.
- **On the server**, inject secrets through your host or platform: Docker `--env-file` / Compose env (not checked in), systemd `Environment=`, Kubernetes secrets, or your PaaS â€œEnvironment variablesâ€ UI. Same keys as in `backend/.env.example`.
- **Backend** stores all sensitive values: `DB_*`, `JWT_SECRET`, `SELLER_USERNAMES` / `SELLER_PASSWORDS`, `SCANNER_USERNAMES` / `SCANNER_PASSWORDS`, optional `ADMIN_USERNAME` / `ADMIN_PASSWORD`, `CORS_ORIGIN`, `TRUST_PROXY`. These exist only in the API process environment.
- **Frontend** (`VITE_*`, e.g. `VITE_API_URL`): values are **baked into the built JavaScript** and are **public**. Use them only for non-secret configuration (such as the public API URL). **Never** put database passwords, JWT secrets, or login passwords in `VITE_*` or in any file under `frontend/src`.
- If a secret was ever committed, **rotate** it (new DB password, new `JWT_SECRET`, new seller/scanner passwords) and avoid re-adding those files to git.

1. **Environment**
   - Set `NODE_ENV=production` for the API.
   - Set `JWT_SECRET` to a random string **at least 32 characters** (the API refuses shorter values in production).
   - Set `CORS_ORIGIN` to the exact browser origin(s), comma-separated (e.g. `https://tickets.example.com` or `https://app.example.com,https://www.example.com`).
   - Set `TRUST_PROXY=1` when the API runs behind nginx, a load balancer, or Docker published ports (so rate limits and IP handling stay correct).

2. **Run the API**
   - `cd backend && npm install && npm start` (not `dev`).

3. **Run the frontend**
   - `cd frontend && npm install && npm run build` â€” output in `frontend/dist/`. Serve with nginx (see `frontend/nginx.conf` and Docker) or any static host.

4. **Health checks**
   - `GET /health` â€” process up.
   - `GET /health/ready` â€” process up and database reachable (returns `503` if DB is down).

5. **Security features included**
   - `helmet` HTTP headers, global rate limiting, stricter rate limit on `POST /auth/login`, strict CORS in production, graceful shutdown (closes the DB pool on `SIGTERM`/`SIGINT`), no error `details` in JSON responses when `NODE_ENV=production`.

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Body: `{ "username", "password" }` â†’ `{ token, username, role, allowedCities }` â€” `role` is `seller`, `admin`, or `scanner` (rate limited) |
| GET | `/auth/me` | Bearer JWT | `{ username, role, allowedCities }` â€” refresh session after reload |
| POST | `/tickets` | Bearer JWT (**seller** or **admin**) | Create ticket; body: `fullName`, `countAdults`, `countStudent`, `countChild` (nonâ€‘negative integers; total attendance 1â€“99; legacy `ticketCount` alone still works), `ticketType`, `price`, `city`, optional `paid`, `paidTo`; **admin** optional `soldBy` |
| GET | `/tickets` | Bearer JWT (**seller** or **admin**) | Query: `search`, `city`, `checkedIn`, `paid`, `paidTo`, `submissionSource`. **Sellers** default to their own rows (`sold_by` = JWT user); `scope=all` (also `everyone`, `all_sellers`) returns all rows like admin. **Admins** see all rows; optional `soldBy` filters to one seller. |
| GET | `/tickets/:code` | Bearer JWT (**seller** or **admin**) | Ticket detail (e.g. `TKT-NY-2083-0001` or legacy `TKT-0001`) |
| PUT | `/tickets/:code` | Bearer JWT (**seller** or **admin**) | Update ticket (same body as create, including `paid` / `paidTo`); **seller**: only own, not checked-in; **admin**: any ticket; **admin** may set `soldBy` |
| DELETE | `/tickets/:code` | Bearer JWT (**seller** or **admin**) | Delete ticket; **seller**: only own, not checked-in; **admin**: any ticket |
| POST | `/tickets/checkin` | Bearer JWT (**scanner** role only) | Body: `{ "ticketCode" }`. Response includes `ticket`: `ticketCode`, `fullName`, `ticketCount`, `price` (SEK), `paid`, `checkedIn` for the scanner UI |
| GET | `/health` | No | Liveness |
| GET | `/health/ready` | No | Readiness (DB ping) |

Ticket codes are `TKT-` plus a zero-padded numeric suffix from the row `id`. If **`TICKET_CODE_EVENT_SLUG`** is set in the API environment (e.g. `NY-2083`), codes are `TKT-{slug}-{id}` (e.g. `TKT-NY-2083-0001`). The API loads **`backend/.env`** by file path (not only when the shell is in `backend/`), so `TICKET_CODE_EVENT_SLUG` is picked up even when you start the server from the repo root. **Docker:** the `api` image does not bundle `.env`; set **`TICKET_CODE_EVENT_SLUG`** in the **project root** `.env` used by Compose (same as `MYSQL_*`). Keep the same value in **`frontend/src/config/eventConfig.js`** (`TICKET_CODE_EVENT_SLUG`) for scanner placeholder text. Omit the env var for legacy `TKT-0001`-only codes. QR codes encode that ticket code as PNG **base64 data URLs** stored in `qr_image_base64`. The UI treats **price** as **Swedish kronor (SEK)**; the database stores a numeric amount only. Each ticket has a **`city`** (program location: Stockholm or Gothenburg). **Payment** fields: **`paid`** (yes/no) and **`paid_to`** (money to the **seller** vs **NRNA NCC account**).

**Existing databases** that were created before newer columns existed should run the combined script once.

That script (`001_tickets_legacy_upgrade.sql`) applies **all** incremental `tickets` changes in one go: city, payment, phone, **`phone_contact_consent`**, submission source, web-order verification columns, and **adults / student / child** counts (with backfill from `ticket_count`). It is **safe to run again**: each `ADD COLUMN` runs only if that column is missing (`information_schema`); on a DB already created from current `schema.sql` / `init.sql`, no `ALTER` runs and only the idempotent `UPDATE` steps execute.

**Run the migration** from the **project root** (the folder that contains `docker-compose.yml`). Credentials come from the `db` container (your root `.env`).

**Most reliable (works even if files have Windows CRLF):** copy-paste this â€” it strips carriage returns from the SQL, then pipes it into `mysql` (no script file needed):

```bash
sed 's/\r$//' migrations/001_tickets_legacy_upgrade.sql | docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

**Alternatives:**

- `bash scripts/run-tickets-migration.sh` â€” same pipe logic; exits non-zero if `mysql` fails; if you see errors about `\r`, your editor saved the script with CRLF. Fix once: `sed -i 's/\r$//' scripts/run-tickets-migration.sh`, or in Cursor set the file to **LF** (status bar) and save.
- `make migrate` â€” if `make` is installed (Makefile uses tabs + LF).

**About `mysql: [Warning] Using a password on the command line interface can be insecure`:** MySQL prints this when the client gets a password via `-pâ€¦`. It is not an SSL error. For local development it is usually fine.

**Fully interactive** (no `-p` on the command line): `docker compose exec db mysql -u root -p` â€” enter the password at the prompt, then run SQL or `SOURCE` a file inside the container.

**Cookies:** The API does not set session cookies. The seller/admin UI stores the JWT in **`localStorage`** (and theme preference may also use `localStorage`). The public order page uses a dedicated Axios client with **`withCredentials: false`** so the browser does not send cookies on those requests. Third-party scripts or hosting could still set cookies; configure nginx or your CDN if you need stricter control.

## Project layout

- `schema.sql` â€” database and `tickets` table (full definition for new installs)
- `migrations/001_tickets_legacy_upgrade.sql` â€” single combined upgrade for older `tickets` tables (legacy columns, phone consent, attendance breakdown; safe to re-run)
- `backend/` â€” Express app (MVC: `routes`, `controllers`, `models`, `services`, `middleware`)
- `frontend/` â€” Vite + React + Tailwind + Axios + `html5-qrcode` scanner

## Security notes (production)

- Terminate **HTTPS** at nginx or your cloud load balancer; do not expose MySQL to the public internet.
- Set strong **seller**, **scanner**, and (if used) **admin** values only in environment variables; rotate them periodically. Consider moving users into the database with proper hashing if you outgrow env-based accounts.
- Run MySQL with a **least-privilege** user and **backups**.
- Keep **JWT** storage appropriate for your threat model (this app uses `localStorage` for simplicity).

