import { fetchRemoteOK } from "./sources/remoteok.mjs";
import { fetchRemotive } from "./sources/remotive.mjs";
import { fetchWWR } from "./sources/weworkremotely.mjs";
import { fetchX } from "./sources/x.mjs";
import { filterWithClaude } from "./filter.mjs";
import { loadSeen, saveSeen } from "./dedupe.mjs";
import { sendTelegramMessage, chunkMessage } from "./telegram.mjs";

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

  const allJobs = [...remoteok, ...remotive, ...wwr, ...x];
  console.log(`Fetched ${allJobs.length} raw postings.`);

  const seen = await loadSeen();
  const unseen = allJobs.filter((job) => !seen.has(job.id));
  console.log(`${unseen.length} unseen postings after dedupe.`);

  const matches = await filterWithClaude(unseen);
  console.log(`${matches.length} matches after relevance filtering.`);

  if (matches.length === 0) {
    console.log("No new matches this run.");
  } else {
    const lines = matches.map((m) => {
      const title = escapeHtml(m.title);
      const company = escapeHtml(m.company || "");
      const reason = escapeHtml(m.reason || "");
      return `\n<b>${title}</b>${company ? ` — ${company}` : ""}\n${m.source} · ${m.url}\n<i>${reason}</i>\n`;
    });

    const header = `🔔 <b>${matches.length} new job match${matches.length > 1 ? "es" : ""}</b>\n`;
    const chunks = chunkMessage(lines);
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
