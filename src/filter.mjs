const KEYWORDS = [
  // Backend
  "backend", "back-end", "back end", "node", "nodejs", "node.js",
  ".net", "dotnet", "c#", "csharp", "asp.net",
  "express", "nestjs", "microservice", "api developer", "multi-tenancy",
  "golang", "go developer", "java developer", "python developer",
  "full stack", "fullstack", "software engineer",
  // Frontend
  "frontend", "front-end", "front end", "react developer", "react.js",
  "vue developer", "nextjs developer", "javascript developer",
  "typescript developer", "web developer",
  // QA
  "qa engineer", "quality assurance", "test engineer", "sdet",
  "automation engineer", "manual tester", "qa analyst",
];

function keywordPreFilter(jobs) {
  return jobs.filter((job) => {
    const haystack = `${job.title} ${job.description} ${(job.tags || []).join(
      " "
    )}`.toLowerCase();
    return KEYWORDS.some((kw) => haystack.includes(kw));
  });
}

const PROFILE = `
Backend-focused full-stack software engineer, ~6 years experience, based in
Lagos, Nigeria. Core stack: .NET / C#, Node.js, React, microservices,
Postgres/Supabase, AWS. Comfortable with contract, remote-first, or
consulting-style engagements.

Only match roles in these three categories:
1. Backend engineering (any language/stack)
2. Frontend engineering (React preferred, but open to other JS frameworks)
3. QA / Test / SDET / QA automation

Reject everything else, including: WordPress-only or Shopify-only roles,
pure UI/graphic/product design roles (even if titled "web designer"),
non-technical roles, junior/entry-level roles, on-site-only roles outside
Nigeria, and roles requiring existing US/EU work authorization (unless
explicitly remote-anywhere).
`;

export async function filterWithClaude(jobs) {
  const candidates = keywordPreFilter(jobs).slice(0, 60); // cap for cost/context
  if (candidates.length === 0) return [];

const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("No ANTHROPIC_API_KEY set — sending Stage 1 (keyword) matches, unfiltered.");
    return candidates.map((c) => ({ ...c, reason: "⚠️ keyword match only — AI filter not run" }));
  }

  const listForModel = candidates.map((c, i) => ({
    index: i,
    title: c.title,
    company: c.company,
    source: c.source,
    tags: c.tags,
    description: c.description.slice(0, 300),
  }));

  const prompt = `You are filtering job postings for this candidate profile:
${PROFILE}

Here is a JSON array of candidate postings:
${JSON.stringify(listForModel, null, 2)}

Return ONLY a JSON array (no prose, no markdown fences) of objects for postings
that are a genuine match, in this shape:
[{"index": 0, "reason": "one short sentence why this fits"}]

Exclude anything clearly irrelevant (non-dev roles, junior-only, on-site-only
in a country the candidate isn't based in, spam/MLM-style posts). If nothing
matches, return [].`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

if (!res.ok) {
    console.error("Claude filter call failed:", res.status, await res.text());
    return candidates.map((c) => ({ ...c, reason: "⚠️ keyword match only — AI filter failed" }));
  }

  const data = await res.json();
  const text = data.content.map((b) => b.text || "").join("\n").trim();
  let picks = [];
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    picks = JSON.parse(clean);
  } catch (err) {
    console.error("Could not parse Claude filter response:", text);
    return [];
  }

  return picks
    .filter((p) => candidates[p.index])
    .map((p) => ({ ...candidates[p.index], reason: p.reason }));
}
