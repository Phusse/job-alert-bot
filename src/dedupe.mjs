import { readFile, writeFile } from "fs/promises";

const SEEN_PATH = new URL("../data/seen-jobs.json", import.meta.url);

export async function loadSeen() {
  try {
    const raw = await readFile(SEEN_PATH, "utf-8");
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export async function saveSeen(seenSet) {
  // Cap stored history so the file doesn't grow forever.
  const arr = [...seenSet].slice(-5000);
  await writeFile(SEEN_PATH, JSON.stringify(arr, null, 2));
}
