# Job Alert Bot

Runs every 12 hours on GitHub Actions. Pulls backend dev postings from
RemoteOK, Remotive, and We Work Remotely (all free, no key needed), optionally
X (paid, off by default), filters them against your profile using the Claude
API, and sends new matches to you on Telegram.

## 1. Create a Telegram bot (2 minutes)

1. In Telegram, message **@BotFather** → `/newbot` → follow the prompts.
2. BotFather gives you a token like `123456:ABC-...` — save it.
3. Message your new bot anything (e.g. "hi") so it can message you back.
4. Get your chat ID: visit
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser after
   step 3, and look for `"chat":{"id": ...}` in the response.

## 2. Get an Anthropic API key

Create one at [console.anthropic.com](https://console.anthropic.com) under
API Keys. This is billed separately from your claude.ai subscription — the
filtering calls use Claude Haiku, so cost per run is a fraction of a cent.

## 3. Push this repo to GitHub

```bash
cd job-alert-bot
git init
git add .
git commit -m "Initial commit"
gh repo create job-alert-bot --private --source=. --push
# (or create the repo on github.com and `git remote add origin ...` + push)
```

## 4. Add secrets

In your new repo: **Settings → Secrets and variables → Actions → New repository secret**.
Add:

| Secret name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | from step 2 |
| `TELEGRAM_BOT_TOKEN` | from step 1 |
| `TELEGRAM_CHAT_ID` | from step 1 |
| `X_BEARER_TOKEN` | optional, see below |

## 5. Test it manually

Go to the **Actions** tab → **Job Alert Bot** → **Run workflow**. Check your
Telegram for a message within a minute or two. Check the run logs if nothing
arrives.

## About the X (Twitter) integration

Off by default (`ENABLE_X_SEARCH: "false"` in the workflow file) because X's
API is pay-per-use as of 2026 — roughly $0.005 per read. To enable:

1. Get API access at [developer.x.com](https://developer.x.com) and set a
   **spending limit** in the console (important — this prevents surprise
   bills).
2. Add `X_BEARER_TOKEN` as a repo secret.
3. Change `ENABLE_X_SEARCH: "false"` to `"true"` in
   `.github/workflows/job-search.yml`.

At the query volume this bot runs (twice a day, ~25 results per run), expect
well under $1/month.

## Tuning

- **Change the schedule**: edit the `cron` line in
  `.github/workflows/job-search.yml`. Cron times are UTC.
- **Change your profile / preferences**: edit `PROFILE` in `src/filter.mjs` —
  this is the text Claude uses to judge relevance.
- **Add more job boards**: drop a new file in `src/sources/`, following the
  same shape (`{ id, source, title, company, url, tags, description, posted }`),
  and import/spread it into `allJobs` in `src/index.mjs`.
- **Reset dedupe**: if you want the bot to re-evaluate everything (e.g. after
  changing your profile text), empty `data/seen-jobs.json` back to `[]`.

## Cost estimate

- RemoteOK, Remotive, We Work Remotely: free.
- Claude Haiku filtering: a few cents a month at this volume.
- GitHub Actions: free (public repos always free; private repos get 2,000
  free minutes/month, and this job takes well under a minute per run).
- X (if enabled): a few dollars a month at most, capped by your own spending
  limit.
