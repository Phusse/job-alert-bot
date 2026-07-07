// Classifies a job posting as Remote, Hybrid, On-site, or Unspecified based
// on its text. Since all three free sources (RemoteOK, Remotive, We Work
// Remotely) are remote-job boards, most postings default to Remote unless
// the text explicitly says otherwise.
export function classifyLocation(job) {
  const haystack = `${job.title} ${job.description} ${(job.tags || []).join(
    " "
  )}`.toLowerCase();

  const hybridSignals = ["hybrid"];
  const onsiteSignals = [
    "on-site", "onsite", "on site", "in-office", "in office",
    "must relocate", "relocation required", "no remote",
  ];
  const remoteSignals = ["remote", "work from home", "wfh", "anywhere"];

  if (hybridSignals.some((s) => haystack.includes(s))) return "Hybrid";
  if (onsiteSignals.some((s) => haystack.includes(s))) return "On-site";
  if (remoteSignals.some((s) => haystack.includes(s))) return "Remote";

  // All three sources are remote-first boards, so default to Remote rather
  // than Unspecified when nothing explicit is found.
  return "Remote";
}

export function groupByLocation(jobs) {
  const groups = { Remote: [], Hybrid: [], "On-site": [] };
  for (const job of jobs) {
    const category = classifyLocation(job);
    groups[category].push(job);
  }
  return groups;
}