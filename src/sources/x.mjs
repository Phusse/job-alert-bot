// X API v2 recent search — OPTIONAL, costs money (pay-per-use, ~$0.005/read
// as of 2026, capped at 2M reads/month). Only runs if X_BEARER_TOKEN is set
// AND ENABLE_X_SEARCH=true, so you can't accidentally rack up charges.
//
// Set a spending cap in the X Developer Console before enabling this.
export async function fetchX() {
  if (process.env.ENABLE_X_SEARCH !== "true" || !process.env.X_BEARER_TOKEN) {
    return [];
  }

  // Keep this query tight — every result read costs money.
  const query = encodeURIComponent(
    '("we\'re hiring" OR "hiring" OR "now hiring") (backend OR ".NET" OR "node.js" OR "nodejs" OR "c#") (remote OR contract) -is:retweet lang:en'
  );
  const url = `https://api.x.com/2/tweets/search/recent?query=${query}&max_results=25&tweet.fields=created_at,author_id`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` },
  });

  if (!res.ok) {
    console.error("X search failed:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.data || []).map((tweet) => ({
    id: `x-${tweet.id}`,
    source: "X",
    title: tweet.text.slice(0, 120),
    company: "",
    url: `https://x.com/i/web/status/${tweet.id}`,
    tags: [],
    description: tweet.text,
    posted: tweet.created_at,
  }));
}
