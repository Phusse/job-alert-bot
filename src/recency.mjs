const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Keeps only jobs posted within the last `days` days. Jobs with a missing
// or unparseable date are kept by default (better to show an unclear-date
// posting than silently drop a real one).
export function filterByRecency(jobs, days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return jobs.filter((job) => {
    if (!job.posted) return true;
    const t = Date.parse(job.posted);
    if (Number.isNaN(t)) return true;
    return t >= cutoff;
  });
}