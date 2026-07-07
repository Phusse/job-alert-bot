// RemoteOK public API — no key required.
export async function fetchRemoteOK() {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "job-alert-bot (personal use)" },
  });
  if (!res.ok) {
    console.error("RemoteOK fetch failed:", res.status);
    return [];
  }
  const data = await res.json();
  // First element is metadata, skip it.
  return data
    .filter((job) => job && job.id && job.position)
    .map((job) => ({
      id: `remoteok-${job.id}`,
      source: "RemoteOK",
      title: job.position,
      company: job.company,
      url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      tags: job.tags || [],
      description: (job.description || "").slice(0, 600),
      posted: job.date,
    }));
}
