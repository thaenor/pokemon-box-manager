import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

const sprite = {
  contentType: "image/svg+xml",
  body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>',
};

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route("https://championsbattledata.com/api/rankings?*", (route) => route.abort());
    await context.route("https://fonts.googleapis.com/**", (route) =>
      route.fulfill({ contentType: "text/css", body: "" }),
    );
    await context.route("https://play.pokemonshowdown.com/sprites/gen5/*.png", (route) =>
      route.fulfill(sprite),
    );
    await context.route(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
      (route) => route.fulfill(sprite),
    );
    await context.route("https://pokeapi.co/api/v2/pokemon/pikachu", (route) =>
      route.fulfill({
        json: {
          species: { name: "pikachu" },
          sprites: {
            front_default: "https://play.pokemonshowdown.com/sprites/gen5/pikachu.png",
            front_shiny: "https://play.pokemonshowdown.com/sprites/gen5/pikachu-shiny.png",
          },
          stats: [{ stat: { name: "hp" }, base_stat: 35 }],
          abilities: [{ ability: { name: "static" } }],
          types: [{ type: { name: "electric" } }],
        },
      }),
    );
    await use(context);
  },
});
