export type UrlCheck =
  | { ok: true; url: string }
  | { ok: false; title: string; text: string };

const HTTP_URL = /^https?:\/\/[^\s/]+\.[^\s/]+/;

export function validateUrl(input: string): UrlCheck {
  const url = input.trim();

  if (!url) {
    return {
      ok: false,
      title: "주소를 입력해 주세요",
      text: "변환할 페이지의 주소를 붙여넣은 뒤 다시 시도해 주세요.",
    };
  }
  if (!HTTP_URL.test(url)) {
    return {
      ok: false,
      title: "올바른 주소가 아닙니다",
      text: "http:// 또는 https://로 시작하는 전체 주소를 입력해 주세요.",
    };
  }
  return { ok: true, url };
}
