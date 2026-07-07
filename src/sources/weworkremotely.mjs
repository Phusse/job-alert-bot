// We Work Remotely public RSS feed — no key required.
// Hand-parsed to avoid an extra XML dependency; the feed format is stable.
export async function fetchWWR() {
  const res = await fetch(
    "https://weworkremotely.com/categories/remote-programming-jobs.rss"
  );
  if (!res.ok) {
    console.error("WWR fetch failed:", res.status);
    return [];
  }
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  const grab = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    if (!m) return "";
    return m[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();
  };

  return items.map((block) => {
    const title = grab(block, "title");
    const link = grab(block, "link");
    const description = grab(block, "description").slice(0, 600);
    const pubDate = grab(block, "pubDate");
    // WWR titles are usually "Company: Job Title"
    const [company, ...rest] = title.split(":");
    return {
      id: `wwr-${link}`,
      source: "We Work Remotely",
      title: rest.length ? rest.join(":").trim() : title,
      company: rest.length ? company.trim() : "",
      url: link,
      tags: [],
      description,
      posted: pubDate,
    };
  });
}
