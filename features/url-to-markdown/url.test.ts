import { describe, expect, test } from "vitest";

import { validateUrl } from "./url";

describe("validateUrl", () => {
  test("http와 https 주소는 공백을 걷어낸 URL로 통과한다", () => {
    expect(validateUrl("  https://blog.example.com/a?b=1 ")).toEqual({
      ok: true,
      url: "https://blog.example.com/a?b=1",
    });
    expect(validateUrl("http://example.com").ok).toBe(true);
  });

  test("비어 있으면 입력을 요청하는 오류를 돌려준다", () => {
    expect(validateUrl("   ")).toMatchObject({
      ok: false,
      title: "주소를 입력해 주세요",
    });
  });

  test("http(s)로 시작하지 않으면 형식 오류를 돌려준다", () => {
    for (const input of ["abc", "ftp://example.com", "example.com/post"]) {
      expect(validateUrl(input)).toMatchObject({
        ok: false,
        title: "올바른 주소가 아닙니다",
      });
    }
  });
});
