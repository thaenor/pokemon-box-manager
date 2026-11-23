import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { afterEach, expect, it, vi } from "vitest";

const page = readFileSync("violet/index.html", "utf8");
const markup = page.split("<body>")[1].split("</body>")[0];
const partyKey = "violet-companion:party";

async function openGuide() {
  // Replace page and window listeners on navigation, keeping this device's storage.
  const browser = new Window();
  browser.document.body.innerHTML = markup;
  vi.stubGlobal("document", browser.document);
  vi.stubGlobal("window", browser);
  vi.resetModules();
  await import("../../violet/app.js");
  return browser.document;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function lookUp(doc, name) {
  const search = doc.querySelector("#species-search");
  search.value = name;
  search.dispatchEvent(new window.Event("input"));
  doc.querySelector("#results button").click();
}

function enterTotal(doc, count) {
  const input = doc.querySelector("#counter-count");
  input.value = String(count);
  input.dispatchEvent(new window.Event("change"));
}

it("resumes a counter after reopening, supports corrections and gives the final level-up step", async () => {
  let doc = await openGuide();
  expect(doc.querySelector("#battle-counter").hidden).toBe(true);
  lookUp(doc, "Primeape");
  expect(doc.querySelector("#counter-less").disabled).toBe(true);
  enterTotal(doc, 19);
  await vi.waitFor(() => expect(doc.querySelector("#counter-bar").value).toBe(19));
  doc.querySelector("#counter-more").click();
  await vi.waitFor(() => expect(doc.querySelector("#counter-more").disabled).toBe(true));
  doc = await openGuide();
  expect(doc.querySelector("#counter-count").value).toBe("20");
  expect(doc.querySelector("#counter-hint").textContent).toBe("Level up Primeape next.");
  doc.querySelector("#counter-less").click();
  await vi.waitFor(() => expect(doc.querySelector("#counter-count").value).toBe("19"));
  enterTotal(doc, 21);
  expect(doc.querySelector("#counter-count").value).toBe("19");
});

it("logs a qualifying win from a party slot without changing the active lookup or losing progress on unpin", async () => {
  const doc = await openGuide();
  lookUp(doc, "Bisharp");
  doc.querySelector("#pin").click();
  lookUp(doc, "Primeape");
  const button = doc.querySelector("#party-add-count-bisharp");
  button.click();
  button.click();
  await vi.waitFor(() => expect(doc.querySelector(".party-next").textContent).toContain("2/3"));
  expect(doc.querySelector("#counter-count").value).toBe("0");
  doc.querySelector(".party-remove").click();
  lookUp(doc, "Bisharp");
  expect(doc.querySelector("#counter-count").value).toBe("2");
  doc.querySelector("#counter-more").click();
  await vi.waitFor(() =>
    expect(doc.querySelector("#counter-hint").textContent).toBe("Level up Bisharp next."),
  );
  enterTotal(doc, 0);
  await vi.waitFor(() => expect(doc.querySelector("#counter-less").disabled).toBe(true));
});

it("restores legacy pins and remembers the chosen evolution method across visits", async () => {
  localStorage.setItem(partyKey, JSON.stringify(["eevee"]));
  let doc = await openGuide();
  expect(doc.querySelector("#species-name").textContent).toBe("Eevee");
  expect(doc.querySelector(".party-next").textContent).toBe("8 evolution options");
  const fire = '[data-method="Use a Fire Stone"]';
  doc.querySelector(fire).click();
  expect(doc.querySelector(".party-next").textContent).toBe("Use a Fire Stone");

  const input = doc.querySelector("#species-search");
  input.value = "charcadet";
  input.dispatchEvent(new window.Event("input"));
  doc.querySelector("#results button").click();
  doc = await openGuide();
  expect(doc.querySelector("#species-name").textContent).toBe("Charcadet");
  doc.querySelector(".party-select").click();
  expect(doc.querySelector(fire).closest("details").open).toBe(true);
  doc.querySelector(fire).click();
  expect(doc.querySelector(".party-next").textContent).toBe("8 evolution options");
  expect(doc.querySelector("#party-count").textContent).toBe("1 / 6");
});

it("pins a specific route directly and lets a trainer switch it without adding another slot", async () => {
  const doc = await openGuide();
  doc.querySelector('[data-method="Use Auspicious Armor"]').click();
  expect(doc.querySelector(".party-next").textContent).toBe("Use Auspicious Armor");
  doc.querySelector('[data-method="Use Malicious Armor"]').click();
  expect(doc.querySelector(".party-next").textContent).toBe("Use Malicious Armor");
  expect(doc.querySelector("#party-count").textContent).toBe("1 / 6");
  expect(doc.querySelectorAll('.track-method[aria-pressed="true"]')).toHaveLength(1);
});

it("keeps multiple pins available for the session when storage rejects writes", async () => {
  const doc = await openGuide();
  const write = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new DOMException("Storage is full", "QuotaExceededError");
  });
  try {
    doc.querySelector("#pin").click();
    lookUp(doc, "Eevee");
    doc.querySelector("#pin").click();
    expect([...doc.querySelectorAll(".party-name")].map((el) => el.textContent)).toEqual([
      "Charcadet",
      "Eevee",
    ]);
    expect(doc.querySelector("#status").textContent).toContain("this session only");
  } finally {
    write.mockRestore();
  }
});
