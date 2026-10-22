import { JSDOM } from "jsdom";
import { Defuddle } from "defuddle/node";

import { validateUrl } from "./url";

export type ConvertedPage = {
  title: string;
  author: string | null;
  markdown: string;
};

export type ConvertErrorKind = "invalid-url" | "unreachable" | "no-content";

export class ConvertError extends Error {
  constructor(
    readonly kind: ConvertErrorKind,
    readonly title: string,
    readonly text: string,
    readonly status?: number
  ) {
    super(`${title}: ${text}`);
  }
}

const FETCH_TIMEOUT_MS = 10_000;

function noContent() {
  return new ConvertError(
    "no-content",
    "본문을 찾지 못했습니다",
    "이 페이지에서 변환할 본문을 찾을 수 없습니다. 로그인이 필요하거나 스크립트로 본문을 그리는 페이지는 지원하지 않습니다."
  );
}

async function fetchHtml(url: string, fetcher: typeof fetch) {
  let response: Response;
  try {
    response = await fetcher(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; UrlToMarkdown/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new ConvertError(
      "unreachable",
      "변환하지 못했습니다",
      "페이지에 연결하지 못했습니다. 주소를 확인하고 다시 시도해 주세요."
    );
  }

  if (!response.ok) {
    throw new ConvertError(
      "unreachable",
      "변환하지 못했습니다",
      `페이지를 가져오지 못했습니다(${response.status}). 로그인이 필요한 페이지는 변환할 수 없습니다.`,
      response.status
    );
  }
  if (!(response.headers.get("content-type") ?? "").includes("html")) {
    throw noContent();
  }
  return response.text();
}

export async function convertPage(
  input: string,
  fetcher: typeof fetch = fetch
): Promise<ConvertedPage> {
  const check = validateUrl(input);
  if (!check.ok) {
    throw new ConvertError("invalid-url", check.title, check.text);
  }

  const html = await fetchHtml(check.url, fetcher);
  const dom = new JSDOM(html, { url: check.url });
  const page = await Defuddle(dom, check.url, { markdown: true });

  const markdown = page.content.trim();
  if (!markdown) throw noContent();

  return {
    title: page.title.trim() || new URL(check.url).hostname,
    author: page.author.trim() || null,
    markdown,
  };
}
