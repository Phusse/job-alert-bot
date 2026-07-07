export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram not configured — printing to console instead.\n" + text);
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    console.error("Telegram send failed:", res.status, await res.text());
  }
}

// Telegram messages cap at 4096 chars — chunk long job lists.
export function chunkMessage(lines, maxLen = 3800) {
  const chunks = [];
  let current = "";
  for (const line of lines) {
    if ((current + line).length > maxLen) {
      chunks.push(current);
      current = "";
    }
    current += line;
  }
  if (current) chunks.push(current);
  return chunks;
}
