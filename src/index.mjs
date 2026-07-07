import { fetchRemoteOK } from "./sources/remoteok.mjs";
import { fetchRemotive } from "./sources/remotive.mjs";
import { fetchWWR } from "./sources/weworkremotely.mjs";
import { fetchX } from "./sources/x.mjs";
import { filterWithClaude } from "./filter.mjs";
import { loadSeen, saveSeen } from "./dedupe.mjs";
import { sendTelegramMessage, chunkMessage } from "./telegram.mjs";
import { filterByRecency } from "./recency.mjs";
import { groupByLocation } from "./location.mjs";

function escapeHtml(str = "") {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  console.log("Fetching job postings...");
  const [remoteok, remotive, wwr, x] = await Promise.all([
    fetchRemoteOK(),
    fetchRemotive(),
    fetchWWR(),
    fetchX(),
  ]);

  const allJobsRaw = [...remoteok, ...remotive, ...wwr, ...x];
  console.log(`Fetched ${allJobsRaw.length} raw postings.`);

  const allJobs = filterByRecency(allJobsRaw, 7);
  console.log(`${allJobs.length} postings within the last 7 days.`);

  const seen = await loadSeen();
  const unseen = allJobs.filter((job) => !seen.has(job.id));
  console.log(`${unseen.length} unseen postings after dedupe.`);

  const matches = await filterWithClaude(unseen);
  console.log(`${matches.length} matches after relevance filtering.`);

  if (matches.length === 0) {
    console.log("No new matches this run.");
    const now = new Date().toLocaleString("en-GB", {
      timeZone: "Africa/Lagos",
      dateStyle: "medium",
      timeStyle: "short",
    });
    await sendTelegramMessage(`No new matches this run (${now}, Lagos time).`);
  } else {
    const groups = groupByLocation(matches);
    const header = `🔔 <b>${matches.length} new job match${matches.length > 1 ? "es" : ""}</b>\n`;

    let allLines = [];
    for (const [category, jobsInGroup] of Object.entries(groups)) {
      if (jobsInGroup.length === 0) continue;
      allLines.push(`\n<b>— ${category} (${jobsInGroup.length}) —</b>\n`);
      for (const m of jobsInGroup) {
        const title = escapeHtml(m.title);
        const company = escapeHtml(m.company || "");
        const reason = escapeHtml(m.reason || "");
        allLines.push(
          `\n<b>${title}</b>${company ? ` — ${company}` : ""}\n${m.source} · ${m.url}\n<i>${reason}</i>\n`
        );
      }
    }

    const chunks = chunkMessage(allLines);
    await sendTelegramMessage(header + chunks[0]);
    for (const chunk of chunks.slice(1)) {
      await sendTelegramMessage(chunk);
    }
  }

  // Mark ALL fetched jobs (not just matches) as seen, so irrelevant
  // postings don't get re-evaluated by Claude every run either.
  for (const job of allJobs) seen.add(job.id);
  await saveSeen(seen);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Job alert bot failed:", err);
  process.exit(1);
});
