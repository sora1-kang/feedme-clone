import { describe, expect, test } from "vitest";

import { aiChatUrl, markdownFileName } from "./export";

describe("markdownFileName", () => {
  test("제목의 문자와 숫자만 남기고 하이픈으로 이어 .md를 붙인다", () => {
    expect(markdownFileName("파일이 앱보다 오래 남는다: 10년 뒤")).toBe(
      "파일이-앱보다-오래-남는다-10년-뒤.md"
    );
  });

  test("40자까지만 쓰고 가장자리 하이픈은 없앤다", () => {
    const name = markdownFileName("가".repeat(39) + " 나나나");

    expect(name).toBe("가".repeat(39) + ".md");
  });

  test("쓸 수 있는 문자가 없으면 기본 이름을 쓴다", () => {
    expect(markdownFileName("???")).toBe("page.md");
  });
});

describe("aiChatUrl", () => {
  test("프롬프트는 쿼리 q에 인코딩해서 싣는다", () => {
    expect(aiChatUrl("chatgpt", "한국어로 번역해줘")).toBe(
      "https://chatgpt.com/?q=" + encodeURIComponent("한국어로 번역해줘")
    );
    expect(aiChatUrl("claude", "요약해줘")).toBe(
      "https://claude.ai/new?q=" + encodeURIComponent("요약해줘")
    );
  });

  test("프롬프트가 없으면 빈 새 대화 주소를 돌려준다", () => {
    expect(aiChatUrl("chatgpt", "")).toBe("https://chatgpt.com/");
    expect(aiChatUrl("claude", "   ")).toBe("https://claude.ai/new");
  });
});
