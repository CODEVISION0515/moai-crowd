import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("ホームページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /仲間と創る/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "案件を探す" })).toBeVisible();
  });

  test("案件一覧ページ", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "案件一覧" })).toBeVisible();
    await expect(page.getByPlaceholder(/キーワード検索/)).toBeVisible();
  });

  test("受注者一覧ページ", async ({ page }) => {
    await page.goto("/workers");
    await expect(page.getByRole("heading", { name: "受注者を探す" })).toBeVisible();
  });

  test("サインアップ → ログイン導線", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "新規登録" }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
    await page.getByRole("link", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証で保護ページにアクセス → ログイン画面へ", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
