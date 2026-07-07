// Remotive public API — no key required.
export async function fetchRemotive() {
  const res = await fetch(
    "https://remotive.com/api/remote-jobs?category=software-dev"
  );
  if (!res.ok) {
    console.error("Remotive fetch failed:", res.status);
    return [];
  }
  const data = await res.json();
  return (data.jobs || []).map((job) => ({
    id: `remotive-${job.id}`,
    source: "Remotive",
    title: job.title,
    company: job.company_name,
    url: job.url,
    tags: job.tags || [],
    description: (job.description || "").replace(/<[^>]+>/g, "").slice(0, 600),
    posted: job.publication_date,
  }));
}
