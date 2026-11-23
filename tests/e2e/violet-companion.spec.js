import { expect, test } from "@playwright/test";

const companion = "./violet/";

async function lookUp(page, name) {
  const search = page.getByRole("searchbox", { name: "Search Pokémon" });
  await search.fill(name);
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, level: 2, exact: true })).toBeVisible();
}

test("shows both Charcadet methods without revealing either outcome", async ({ page }) => {
  await page.goto(companion);
  await expect(page.getByRole("heading", { name: "Charcadet", level: 2 })).toBeVisible();

  const methods = page.locator(".method-summary");
  await expect(methods).toHaveCount(2);
  await expect(methods.first()).toContainText(/Malicious Armor/i);
  await expect(methods.last()).toContainText(/Auspicious Armor/i);
  for (const method of await methods.all()) {
    await method.click();
    await expect(page.locator("body")).not.toContainText(/Ceruledge|Armarouge/i);
    await expect(page.getByAltText(/Ceruledge|Armarouge/i)).toHaveCount(0);
  }
  await expect(page.getByText(/10 Sinistea Chips/i).first()).toBeVisible();
});

test("supports a keyboard lookup and party changes on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(companion);
  const search = page.getByRole("searchbox", { name: "Search Pokémon" });
  await search.fill("eevee");
  await search.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Eevee", level: 2 })).toBeVisible();
  await expect(page.locator(".method-summary")).toHaveCount(8);
  const methods = page.locator(".method-list");
  await expect(methods).not.toContainText(
    /Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon/i,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Pin to party", exact: true }).click();
  const party = page.getByRole("region", { name: "Pinned party" });
  await expect(party).toContainText("Eevee");
  await page.reload();
  await expect(party).toContainText("Eevee");
  await party.locator(".party-select").filter({ hasText: "Eevee" }).click();
  await page.getByRole("button", { name: "Remove from party", exact: true }).click();
  await expect(party).not.toContainText("Eevee");
});

test("reopens offline and looks up an unvisited species", async ({ page, context }) => {
  await page.goto(companion);
  await expect(page.getByRole("heading", { name: "Charcadet", level: 2 })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.goto("./violet");
  await lookUp(page, "Sprigatito");
  await expect(page.locator(".method-summary")).toContainText(/16/);
  await page.getByRole("link", { name: "Box Manager" }).click();
  await expect(page.getByTestId("box-slot")).toHaveCount(40);
});
