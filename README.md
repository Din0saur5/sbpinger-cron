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

## Setting Up the Cron Job on Render

### 1. **Deploy the Repository**

Ensure you have cloned or forked this repository to your GitHub.

```bash
git clone https://github.com/yourusername/supabase-cron-job.git
cd supabase-cron-job
```

### 2. **Install Dependencies**

Once inside the project folder, install dependencies:

```bash
npm install
```

### 3. **Configure Environment Variables**

Create a `.env` file in the project root and add your Supabase credentials:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-api-key
```

On Render, set these environment variables in the **Environment** settings of your cron job service.

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

