import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 주소 입력창이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("URL을 Markdown으로");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "URL을 Markdown으로"
  );
  await expect(page.getByLabel("페이지 주소")).toBeVisible();
});
