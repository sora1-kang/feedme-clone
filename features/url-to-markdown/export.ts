export type AiService = "chatgpt" | "claude";

const NEW_CHAT: Record<AiService, string> = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
};

export function markdownFileName(title: string) {
  const base = title
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  return `${base || "page"}.md`;
}

export function aiChatUrl(service: AiService, prompt: string) {
  const text = prompt.trim();
  const base = NEW_CHAT[service];
  return text ? `${base}?q=${encodeURIComponent(text)}` : base;
}
