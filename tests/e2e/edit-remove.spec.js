import { test, expect } from "./fixtures.js";

/**
 * Shared Pokémon fixture for edit/remove E2E tests.
 * Matches the shape produced by showPokemonDetail save and sanitizePokemon.
 */
const POKEMON = {
  species: {
    name: "Pikachu",
    showdownId: "pikachu",
    types: ["Electric"],
  },
  showdownId: "pikachu",
  nickname: "Sparky",
  sprite: "https://play.pokemonshowdown.com/sprites/gen5/pikachu.png",
  spriteShiny: "https://play.pokemonshowdown.com/sprites/gen5/pikachu-shiny.png",
  isShiny: false,
  stats: [
    { name: "hp", value: 35 },
    { name: "attack", value: 55 },
    { name: "defense", value: 40 },
    { name: "special-attack", value: 50 },
    { name: "special-defense", value: 50 },
    { name: "speed", value: 90 },
  ],
  ability: "static",
  nature: "Serious",
  recruitedDate: "2026-09-01",
};

/** Build a 30-slot box with Pikachu in slot 0 (or all empty). */
function buildBox(withPokemon = true) {
  const box = new Array(30).fill(null);
  if (withPokemon) box[0] = POKEMON;
  return box;
}

test.describe("Edit and remove Pokémon flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./champions/");
  });

  test("clicking a filled slot opens the detail form", async ({ page }) => {
    await page.evaluate(
      (data) => localStorage.setItem("pokemon-box:slots", JSON.stringify(data)),
      buildBox(true),
    );
    await page.reload();

    // Click first filled slot
    await page.locator('[data-testid="box-slot"]').first().click();

    // Detail form should open in edit mode — "Editing — species locked" badge
    await expect(page.getByText("Editing — species locked")).toBeVisible({
      timeout: 10000,
    });
  });

  test("detail form is pre-filled with existing data", async ({ page }) => {
    await page.evaluate(
      (data) => localStorage.setItem("pokemon-box:slots", JSON.stringify(data)),
      buildBox(true),
    );
    await page.reload();

    // Click first slot
    await page.locator('[data-testid="box-slot"]').first().click();

    // Wait for the form to render (after PokéAPI fetch)
    await expect(page.locator("#detail-nickname")).toBeVisible({ timeout: 10000 });

    // Verify pre-filled values
    await expect(page.locator("#detail-nickname")).toHaveValue("Sparky");
    await expect(page.locator("#detail-ability")).toHaveValue("static");
    await expect(page.locator("#detail-nature")).toHaveValue("Serious");
  });

  test("save updates the slot and shows success toast", async ({ page }) => {
    await page.evaluate(
      (data) => localStorage.setItem("pokemon-box:slots", JSON.stringify(data)),
      buildBox(true),
    );
    await page.reload();

    // Click first slot
    await page.locator('[data-testid="box-slot"]').first().click();

    // Wait for form
    await expect(page.locator("#detail-nickname")).toBeVisible({ timeout: 10000 });

    // Edit nickname
    await page.locator("#detail-nickname").fill("Lightning");

    // Click Save
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success toast
    const successToast = page.locator(".toast--success");
    await expect(successToast).toBeVisible({ timeout: 3000 });
    await expect(successToast).toContainText(/Pikachu updated/);

    // Verify the box grid re-renders with the Pokémon still visible
    await expect(page.locator('[data-testid="box-slot"]').first()).toBeVisible();
  });

  test("remove button shows confirmation, then deletes on confirm", async ({ page }) => {
    await page.evaluate(
      (data) => localStorage.setItem("pokemon-box:slots", JSON.stringify(data)),
      buildBox(true),
    );
    await page.reload();

    // Click first slot
    await page.locator('[data-testid="box-slot"]').first().click();

    // Wait for the Remove button (edit mode)
    await expect(page.getByRole("button", { name: "Remove" })).toBeVisible({
      timeout: 10000,
    });

    // Click Remove — should show confirmation dialog
    await page.getByRole("button", { name: "Remove" }).click();

    // Confirmation dialog should appear
    await expect(page.getByText(/cannot be undone/)).toBeVisible({
      timeout: 3000,
    });

    // Click the confirm Remove button in the dialog
    await page.locator(".overlay:last-of-type .btn-destructive").click();

    // Verify info toast
    const infoToast = page.locator(".toast--info");
    await expect(infoToast).toBeVisible({ timeout: 3000 });
    await expect(infoToast).toContainText(/removed from box/);

    // Verify empty state appears (box had only 1 Pokémon, now empty)
    await expect(page.getByText("Your box is empty")).toBeVisible({ timeout: 3000 });
  });

  test("cancel closes modal without changes", async ({ page }) => {
    await page.evaluate(
      (data) => localStorage.setItem("pokemon-box:slots", JSON.stringify(data)),
      buildBox(true),
    );
    await page.reload();

    // Click first slot
    await page.locator('[data-testid="box-slot"]').first().click();

    // Wait for form
    await expect(page.locator("#detail-nickname")).toBeVisible({ timeout: 10000 });

    // Edit a field (to verify it's not saved on cancel)
    await page.locator("#detail-nickname").fill("Should Not Save");

    // Click the overlay background (outside the panel) to close
    await page.locator(".overlay").click({ position: { x: 5, y: 5 } });

    // Verify grid still shows the Pokémon (no change)
    await expect(page.locator('[data-testid="box-slot"]').first()).toBeVisible();

    // Verify nickname in localStorage is unchanged
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pokemon-box:slots") || "[]"),
    );
    expect(saved[0].nickname).toBe("Sparky");
  });
});
