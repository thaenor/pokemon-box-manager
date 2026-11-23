import { test, expect } from "./fixtures.js";

test.describe("Box flow E2E", () => {
  test("renders empty state on load", async ({ page }) => {
    await page.goto("./champions/");
    // Wait for app to render: empty state text
    await expect(page.locator("text=Your box is empty")).toBeVisible();
    await expect(page.locator("text=Tap an empty slot to add a Pokémon")).toBeVisible();
  });

  test("box slots have data-testid attribute", async ({ page }) => {
    await page.goto("./champions/");
    const slots = page.locator('[data-testid="box-slot"]');
    await expect(slots).toHaveCount(40);
  });

  test("grid size dropdown exists with 30/35/40 options", async ({ page }) => {
    await page.goto("./champions/");
    const select = page.locator("select");
    await expect(select).toBeVisible();
    await expect(select.locator("option")).toHaveCount(3);
    await expect(select).toHaveValue("40"); // default is 40
  });

  test("changing grid size updates slot count and persists on reload", async ({ page }) => {
    await page.goto("./champions/");
    const select = page.locator("select");

    // Mock confirm to accept the truncation dialog (decreasing from 40→35)
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Change to 35
    await select.selectOption("35");
    const slots = page.locator('[data-testid="box-slot"]');
    await expect(slots).toHaveCount(35);

    // Reload — selection should persist
    await page.reload();
    await expect(page.locator("select")).toHaveValue("35");
    await expect(page.locator('[data-testid="box-slot"]')).toHaveCount(35);
  });

  test("capacity counter updates when grid size changes", async ({ page }) => {
    await page.goto("./champions/");
    // Default 40, empty → 0/40
    await expect(page.locator("text=0/40")).toBeVisible();

    // Mock confirm to accept the truncation dialog (decreasing from 40→30)
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Change to 30
    await page.locator("select").selectOption("30");
    await expect(page.locator("text=0/30")).toBeVisible();
  });

  test("restores a backup with a species outside the current roster and exports both formats", async ({
    page,
  }) => {
    const species = {
      id: 504,
      name: "Patrat",
      showdownId: "patrat",
      types: ["Normal"],
      spriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/504.png",
      isMega: false,
      isUltra: false,
    };
    const backup = [{ species, nickname: "Scout", ability: "Run Away", nature: "Jolly" }];
    await page.goto("./champions/");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await page.locator("textarea").fill(JSON.stringify(backup));
    await page.locator(".overlay").getByRole("button", { name: "Import", exact: true }).click();
    await page.reload();
    await expect(page.getByTestId("box-slot").first()).toContainText("Patrat");

    await page.getByRole("button", { name: "Export", exact: true }).click();
    const textarea = page.locator("textarea");
    const exported = JSON.parse(await textarea.inputValue());
    expect(exported).toHaveLength(1);
    expect(exported[0]).toMatchObject(backup[0]);
    await page.getByRole("button", { name: "Pokepaste", exact: true }).click();
    await expect(textarea).toHaveValue("Scout (Patrat)\nAbility: Run Away\nJolly Nature");
  });
});
