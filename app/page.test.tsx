import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 제목, 주소 입력창, 테마 토글을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "URL을 Markdown으로" })
  ).toBeInTheDocument();
  expect(screen.getByLabelText("페이지 주소")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "화면 테마 바꾸기" })
  ).toBeInTheDocument();
});
