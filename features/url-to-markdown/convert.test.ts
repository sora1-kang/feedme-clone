// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

import { ConvertError, convertPage } from "./convert";

const paragraphs = Array.from(
  { length: 6 },
  (_, i) =>
    `<p>${i + 1}번째 문단입니다. 파일이 앱보다 오래 남는다는 말은 도구를 고르는 기준을 바꿔 놓습니다. 어떤 앱이 마음에 드는지를 묻기 전에 그 앱이 사라진 뒤에도 기록을 열어볼 수 있는지를 먼저 묻게 됩니다.</p>`
).join("\n");

function page({ author = true, body = paragraphs } = {}) {
  return `<!doctype html><html lang="ko"><head>
    <title>파일이 앱보다 오래 남는다</title>
    ${author ? '<meta name="author" content="한지원">' : ""}
  </head><body>
    <nav><a href="/">홈</a></nav>
    <article><h1>파일이 앱보다 오래 남는다</h1>${body}</article>
    <footer>© 2026</footer>
  </body></html>`;
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

describe("convertPage", () => {
  test("본문을 Markdown으로 바꾸고 제목과 저자를 돌려준다", async () => {
    const fetcher = vi.fn(async () => htmlResponse(page()));

    const result = await convertPage("https://blog.example.com/a", fetcher);

    expect(result.title).toBe("파일이 앱보다 오래 남는다");
    expect(result.author).toBe("한지원");
    expect(result.markdown).toContain("1번째 문단입니다.");
    expect(result.markdown).not.toContain("<p>");
    expect(fetcher).toHaveBeenCalledWith(
      "https://blog.example.com/a",
      expect.objectContaining({ redirect: "follow" })
    );
  });

  test("저자 정보가 없으면 저자는 null이다", async () => {
    const fetcher = async () => htmlResponse(page({ author: false }));

    const result = await convertPage("https://blog.example.com/a", fetcher);

    expect(result.author).toBeNull();
    expect(result.title).toBe("파일이 앱보다 오래 남는다");
  });

  test("잘못된 주소는 요청 없이 invalid-url 오류가 된다", async () => {
    const fetcher = vi.fn();

    await expect(convertPage("abc", fetcher)).rejects.toMatchObject({
      kind: "invalid-url",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("상태 코드가 실패이면 unreachable 오류에 상태 코드를 담는다", async () => {
    const fetcher = async () => htmlResponse("denied", 403);

    const error = await convertPage("https://intranet.example.com/x", fetcher).catch(
      (e) => e
    );

    expect(error).toBeInstanceOf(ConvertError);
    expect(error).toMatchObject({ kind: "unreachable", status: 403 });
    expect(error.text).toContain("403");
  });

  test("연결 자체가 실패해도 unreachable 오류가 된다", async () => {
    const fetcher = async () => {
      throw new TypeError("fetch failed");
    };

    await expect(
      convertPage("https://nowhere.example.com", fetcher)
    ).rejects.toMatchObject({ kind: "unreachable" });
  });

  test("본문이 없거나 HTML이 아니면 no-content 오류가 된다", async () => {
    const empty = async () => htmlResponse(page({ body: "" }));
    const json = async () =>
      new Response("{}", { headers: { "content-type": "application/json" } });

    await expect(
      convertPage("https://blog.example.com/empty", empty)
    ).rejects.toMatchObject({ kind: "no-content" });
    await expect(
      convertPage("https://blog.example.com/data", json)
    ).rejects.toMatchObject({ kind: "no-content" });
  });
});
