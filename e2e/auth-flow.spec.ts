import { test, expect } from "@playwright/test";

// 実際の登録→ログイン→ログアウトフロー
// Supabase本番DBを汚さないよう、E2E専用プロジェクトで実行すること

const uniqueEmail = () => `e2e+${Date.now()}@example.com`;

test.describe("認証フロー", () => {
  test("新規登録 → ダッシュボード表示 → ログアウト", async ({ page }) => {
    test.skip(!process.env.E2E_RUN_AUTH, "E2E_RUN_AUTH=1 で有効化");
    const email = uniqueEmail();
    const password = "TestPassword123!";

    await page.goto("/signup");
    await page.getByLabel("表示名").fill("E2E テスター");
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel(/パスワード/).fill(password);
    await page.getByRole("button", { name: "アカウント作成" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();

    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page.getByRole("link", { name: "新規登録" })).toBeVisible();
  });
});
