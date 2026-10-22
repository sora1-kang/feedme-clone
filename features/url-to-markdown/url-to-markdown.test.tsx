import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { UrlToMarkdown } from "./index";

const page = {
  title: "파일이 앱보다 오래 남는다: 10년 뒤에도 열어볼 수 있는 노트",
  author: "한지원",
  markdown: "첫 문단입니다.\n\n## 다섯 가지 원칙\n\n- 읽을 수 있는 형식\n- 파일 하나",
};

const writeText = vi.fn();
const open = vi.fn();
const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  open.mockReset();
  fetchMock.mockReset().mockImplementation(async () => jsonResponse(page));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("open", open);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => vi.unstubAllGlobals());

async function convert(url = "https://blog.example.com/a") {
  fireEvent.change(screen.getByLabelText("페이지 주소"), {
    target: { value: url },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  return screen.findByRole("heading", { level: 2, name: page.title });
}

test("처음에는 입력창과 두 아이콘 버튼만 보인다", () => {
  render(<UrlToMarkdown />);

  expect(screen.getByLabelText("페이지 주소")).toHaveValue("");
  expect(screen.getByRole("button", { name: "변환하기" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "지우기" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
});

test("변환하면 제목, 저자, 렌더링된 Markdown이 나온다", async () => {
  render(<UrlToMarkdown />);

  await convert();

  expect(screen.getByText("한지원")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "다섯 가지 원칙" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/convert",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ url: "https://blog.example.com/a" }),
    })
  );
});

test("변환 중에는 버튼이 비활성화되어 같은 요청을 다시 보낼 수 없다", async () => {
  let resolve!: (r: Response) => void;
  fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
  render(<UrlToMarkdown />);

  fireEvent.change(screen.getByLabelText("페이지 주소"), {
    target: { value: "https://blog.example.com/a" },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  const busy = await screen.findByRole("button", { name: "변환 중" });
  fireEvent.click(busy);
  fireEvent.submit(screen.getByLabelText("페이지 주소").closest("form")!);

  expect(busy).toBeDisabled();
  expect(fetchMock).toHaveBeenCalledTimes(1);

  resolve(jsonResponse(page));
  await screen.findByRole("heading", { level: 2, name: page.title });
});

test("저자가 없으면 저자 줄 없이 제목과 본문만 나온다", async () => {
  fetchMock.mockImplementation(async () => jsonResponse({ ...page, author: null }));
  render(<UrlToMarkdown />);

  await convert();

  expect(screen.queryByText("한지원")).not.toBeInTheDocument();
  expect(screen.getByText("첫 문단입니다.")).toBeInTheDocument();
});

test("빈 입력이나 잘못된 주소는 요청 없이 입력창 아래 오류로 알린다", () => {
  render(<UrlToMarkdown />);

  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  expect(screen.getByRole("alert")).toHaveTextContent("주소를 입력해 주세요");

  fireEvent.change(screen.getByLabelText("페이지 주소"), {
    target: { value: "abc" },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  expect(screen.getByRole("alert")).toHaveTextContent("올바른 주소가 아닙니다");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("서버 오류는 원인을 보여 주고 이전 결과를 남기지 않는다", async () => {
  render(<UrlToMarkdown />);
  await convert();

  fetchMock.mockImplementation(async () =>
    jsonResponse(
      { error: { kind: "unreachable", title: "변환하지 못했습니다", text: "페이지를 가져오지 못했습니다(403)." } },
      502
    )
  );
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("(403)");
  expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
});

test("서버에 닿지 못해도 오류로 알린다", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  render(<UrlToMarkdown />);

  fireEvent.change(screen.getByLabelText("페이지 주소"), {
    target: { value: "https://blog.example.com/a" },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("변환하지 못했습니다");
});

test("지우기는 입력, 결과, 오류, 프롬프트 선택을 모두 비운다", async () => {
  render(<UrlToMarkdown />);
  await convert();
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));

  expect(screen.getByLabelText("페이지 주소")).toHaveValue("");
  expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "지우기" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  await convert();
  expect(screen.getByRole("button", { name: "요약해줘" })).toHaveAttribute("aria-pressed", "false");
});

test("복사하기는 Markdown 본문만 클립보드에 넣고 알려 준다", async () => {
  render(<UrlToMarkdown />);
  await convert();

  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));

  await waitFor(() => expect(writeText).toHaveBeenCalledWith(page.markdown));
  expect(await screen.findByText("복사했습니다")).toBeInTheDocument();
});

test(".md 다운로드는 제목으로 만든 파일 이름으로 저장한다", async () => {
  const createObjectURL = vi.fn(() => "blob:md");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
  const downloads: string[] = [];
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
  render(<UrlToMarkdown />);
  await convert();

  fireEvent.click(screen.getByRole("button", { name: ".md 다운로드" }));

  expect(downloads).toEqual(["파일이-앱보다-오래-남는다-10년-뒤에도-열어볼-수-있는-노트.md"]);
  const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
  expect(await blob.text()).toBe(page.markdown);
  expect(screen.getByRole("status")).toHaveTextContent(".md 파일을 내려받았습니다");
  click.mockRestore();
});

test("ChatGPT로 열기는 본문을 복사하고 프롬프트를 쿼리에 실어 새 탭을 연다", async () => {
  render(<UrlToMarkdown />);
  await convert();
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));

  await waitFor(() => expect(open).toHaveBeenCalled());
  expect(writeText).toHaveBeenCalledWith(page.markdown);
  expect(open).toHaveBeenCalledWith(
    "https://chatgpt.com/?q=" + encodeURIComponent("요약해줘"),
    "_blank",
    "noopener,noreferrer"
  );
  expect(screen.getByRole("status")).toHaveTextContent("요약해줘");
});

test("프롬프트를 고르지 않으면 빈 새 대화를 연다", async () => {
  render(<UrlToMarkdown />);
  await convert();

  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));

  await waitFor(() =>
    expect(open).toHaveBeenCalledWith("https://claude.ai/new", "_blank", "noopener,noreferrer")
  );
});

test("직접 입력을 고르면 입력창이 나타나고 그 내용이 프롬프트가 된다", async () => {
  render(<UrlToMarkdown />);
  await convert();
  expect(screen.queryByLabelText("직접 입력한 프롬프트")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  fireEvent.change(screen.getByLabelText("직접 입력한 프롬프트"), {
    target: { value: "핵심만 세 줄로" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));

  await waitFor(() =>
    expect(open).toHaveBeenCalledWith(
      "https://claude.ai/new?q=" + encodeURIComponent("핵심만 세 줄로"),
      "_blank",
      "noopener,noreferrer"
    )
  );
});

test("클립보드 쓰기에 실패하면 새 탭을 열지 않고 알린다", async () => {
  writeText.mockRejectedValue(new Error("denied"));
  render(<UrlToMarkdown />);
  await convert();

  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));

  expect(await screen.findByRole("status")).toHaveTextContent("복사하지 못했습니다");
  expect(open).not.toHaveBeenCalled();
});
