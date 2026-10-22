// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";

import { POST } from "./route";

const article = `<!doctype html><html><head><title>글 제목</title>
<meta name="author" content="한지원"></head><body><article><h1>글 제목</h1>${Array.from(
  { length: 6 },
  (_, i) =>
    `<p>${i + 1}번째 문단입니다. 파일이 앱보다 오래 남는다는 말은 도구를 고르는 기준을 바꿔 놓습니다. 어떤 앱이 마음에 드는지를 묻기 전에 그 앱이 사라진 뒤에도 기록을 열어볼 수 있는지를 먼저 묻게 됩니다.</p>`
).join("")}</article></body></html>`;

function request(body: unknown) {
  return new Request("http://localhost/api/convert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

test("변환에 성공하면 제목, 저자, Markdown을 200으로 돌려준다", async () => {
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(article, { headers: { "content-type": "text/html" } })
  );

  const response = await POST(request({ url: "https://blog.example.com/a" }));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    title: "글 제목",
    author: "한지원",
    markdown: expect.stringContaining("1번째 문단입니다."),
  });
});

test("주소가 잘못되면 400과 사용자용 메시지를 돌려준다", async () => {
  const response = await POST(request({ url: "abc" }));

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: {
      kind: "invalid-url",
      title: "올바른 주소가 아닙니다",
      text: expect.any(String),
    },
  });
});

test("본문 형식이 JSON이 아니어도 400이다", async () => {
  const response = await POST(request("not json"));

  expect(response.status).toBe(400);
});

test("가져오기에 실패하면 502, 본문이 없으면 422이다", async () => {
  vi.stubGlobal("fetch", async () => new Response("x", { status: 403 }));
  const blocked = await POST(request({ url: "https://intranet.example.com/x" }));
  expect(blocked.status).toBe(502);
  expect((await blocked.json()).error.text).toContain("403");

  vi.stubGlobal(
    "fetch",
    async () =>
      new Response("<html><body></body></html>", {
        headers: { "content-type": "text/html" },
      })
  );
  const empty = await POST(request({ url: "https://blog.example.com/empty" }));
  expect(empty.status).toBe(422);
  expect((await empty.json()).error.kind).toBe("no-content");
});
