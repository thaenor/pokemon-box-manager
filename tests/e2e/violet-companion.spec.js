import { expect, test } from "./fixtures.js";

const companion = "./violet/";

async function lookUp(page, name) {
  const search = page.getByRole("searchbox", { name: "Search Pokémon" });
  await search.fill(name);
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, level: 2, exact: true })).toBeVisible();
}

test("reopens recent searches in order without adding party visits to history", async ({
  page,
}) => {
  await page.goto(companion);
  await expect(page.getByRole("heading", { name: "Charcadet", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pin to party", exact: true }).click();
  await lookUp(page, "Dunsparce");
  await page.locator(".method-summary").click();
  await expect(page.getByText(/Learns Hyper Drill at Lv\. 32/)).toBeVisible();
  await lookUp(page, "Eevee");
  await page.getByRole("button", { name: "View Charcadet" }).click();
  await page.reload();
  const search = page.getByRole("searchbox", { name: "Search Pokémon" });
  await search.focus();
  const recent = page.getByRole("list", { name: "Recently searched" });
  await expect(recent.getByRole("button")).toHaveCount(2);
  await expect(recent.getByRole("button").first()).toHaveAccessibleName("Eevee");
  await recent.getByRole("button", { name: "Dunsparce", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dunsparce", exact: true })).toBeVisible();
  await search.focus();
  await expect(recent.getByRole("button")).toHaveCount(2);
  await expect(recent.getByRole("button").first()).toHaveAccessibleName("Dunsparce");
});

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

for (const existing of [[], ["pawmi", "pawmo", "pawmot", "quaxly", "fuecoco"]]) {
  test(`saves concurrent pins across tabs with ${existing.length} occupied slots`, async ({
    page,
    context,
  }) => {
    const key = "violet-companion:party";
    await page.goto(companion);
    await page.evaluate(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [key, existing],
    );
    await page.reload();
    const other = await context.newPage();
    await other.goto(companion);
    await lookUp(page, "Eevee");
    await lookUp(other, "Charcadet");

    // Make both tabs act on the same snapshot before either can save.
    await page.evaluate(
      (key) =>
        new Promise((ready) => {
          navigator.locks.request(
            key,
            () =>
              new Promise((release) => {
                window.releasePartyLock = release;
                ready();
              }),
          );
        }),
      key,
    );
    await page.getByRole("button", { name: "Pin to party", exact: true }).click();
    await page.waitForFunction(
      async (key) => (await navigator.locks.query()).pending.some((lock) => lock.name === key),
      key,
    );
    await other.getByRole("button", { name: "Pin to party", exact: true }).click();
    await page.waitForFunction(
      async (key) =>
        (await navigator.locks.query()).pending.filter((lock) => lock.name === key).length === 2,
      key,
    );
    await lookUp(page, "Sprigatito");
    await page.evaluate(async (key) => {
      window.releasePartyLock();
      await navigator.locks.request(key, () => {});
    }, key);
    const expected = [...existing, "eevee", "charcadet"].slice(0, 6);
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
    expect(saved.map((entry) => entry.id)).toEqual(expected);
    await other.reload();
    await expect(other.locator(".party-name")).toHaveText(
      expected.map((id) => id[0].toUpperCase() + id.slice(1)),
    );
  });
}
