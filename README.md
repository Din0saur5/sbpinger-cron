# Supabase Inactivity Cron Job

This project automates periodic updates to a Supabase table (`pings`) using a cron job. Each run inserts a new entry into the table, logging a timestamp and setting a `pinged` column to `true`.

## Features

- **Automated Logging**: Inserts a new row in the `pings` table at scheduled intervals.
- **Supabase Integration**: Uses Supabase's REST API to interact with the database.
- **Render Cron Job Support**: Easily set up a scheduled execution on [Render](https://render.com/).

## Setting Up the Table on Supabase

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In your project's dashboard, create a table named `pings` with the following schema:
   - **id** (Integer, Auto-incrementing, Primary Key)
   - **timestamp** (Timestamp, Default: `NOW()`)
   - **pinged** (Boolean, Default: `true`)

You can drop this into the sql editor directly:
   ```sql
-- Create the table
create table public.pings (
  id bigserial primary key,
  created_at timestamp with time zone default now(),
  pinged boolean default true
);

-- Disable Row Level Security (RLS) on that table
alter table public.pings disable row level security;
```

## Setting Up the Cron Job on Render

### 1. **Deploy the Repository**

Ensure you have cloned or forked this repository to your GitHub.

```bash
git clone https://github.com/yourusername/supabase-cron-job.git
cd supabase-cron-job
```

### 2. **Configure Environment Variables**

Create a `.env` file in the project root and add an array of your Supabase credentials:
- Use valid JSON with double-quoted property names and strings. Whitespace
  between JSON tokens is allowed; keys must not contain spaces or newlines.

```env
# ONE LINE JSON
SUPABASES_JSON=[{"url":"https://proj1.supabase.co","key":"service-or-anon-key-1"},{"url":"https://proj2.supabase.co","key":"service-or-anon-key-2"}]

```

On Render, set these environment variables in the **Environment** settings of your cron job service.

Publishable (`sb_publishable_...`) and secret (`sb_secret_...`) keys are sent
only in the `apikey` header. Legacy JWT `anon` and `service_role` keys keep
their existing `Authorization: Bearer` header as well.

For a publishable key, keep RLS enabled and allow only inserts of successful
pings. After creating `public.pings` as above, use:

```sql
alter table public.pings enable row level security;
revoke all on table public.pings from anon, authenticated;
revoke all on sequence public.pings_id_seq from anon, authenticated;
grant insert (created_at, pinged) on table public.pings to anon;
grant usage on sequence public.pings_id_seq to anon;

create policy pings_anon_insert
on public.pings
for insert
to anon
with check (pinged is true);
```

This permits anonymous heartbeat inserts without permitting reads, updates,
or deletes. It does not grant access to other tables. Leave the default
minimal response for inserts; returning inserted rows would require SELECT
permission.

### 3. **Install Dependencies and Validate Configuration**

Set `SUPABASES_JSON` in your `.env` file or environment before installing:

```bash
npm install
```

The `postinstall` hook validates the configuration automatically during both
`npm install` and `npm ci`, including Render's existing `npm install` build
command. A missing or malformed variable exits with code 1 and fails the
build. Every array entry must be an object containing a valid HTTP/HTTPS
project base URL and a non-empty key; invalid entries are never silently
skipped. Example build error:

```text
Configuration error: SUPABASES_JSON entry 2: "key" must be a non-empty string.
```

Run `npm run build` or `npm run validate:env` to check again. Validation checks
configuration structure without making network requests or printing keys.
The cron uses the same validation before making any requests. A real cron run
is still needed to verify credentials and database permissions.

Run the regression tests with `npm test`. To install dependencies solely for
development or tests before you have configured credentials, use
`npm ci --ignore-scripts`, then `npm test`.

### 4. **Set Up the Cron Job on Render**

1. Go to your [Render Dashboard](https://dashboard.render.com/).

2. Navigate to **Cron Jobs** and create a new job.

3. Set the schedule using cron syntax (e.g., `0 12 * * *` for noon daily).

4. In the Build command field, enter:

   ```bash
   npm install
   ```

5. In the command field, enter:

   ```bash
   node ping.js
   ```

6. Set your env variables on render like your .env file

7. Deploy and activate the cron job.

##

