export const natures = [
  { name: "Hardy", increased: null, decreased: null },
  { name: "Lonely", increased: "Attack", decreased: "Defense" },
  { name: "Brave", increased: "Attack", decreased: "Speed" },
  { name: "Adamant", increased: "Attack", decreased: "Special Attack" },
  { name: "Naughty", increased: "Attack", decreased: "Special Defense" },
  { name: "Bold", increased: "Defense", decreased: "Attack" },
  { name: "Docile", increased: null, decreased: null },
  { name: "Relaxed", increased: "Defense", decreased: "Speed" },
  { name: "Impish", increased: "Defense", decreased: "Special Attack" },
  { name: "Lax", increased: "Defense", decreased: "Special Defense" },
  { name: "Timid", increased: "Speed", decreased: "Attack" },
  { name: "Hasty", increased: "Speed", decreased: "Defense" },
  { name: "Serious", increased: null, decreased: null },
  { name: "Jolly", increased: "Speed", decreased: "Special Attack" },
  { name: "Naive", increased: "Speed", decreased: "Special Defense" },
  { name: "Modest", increased: "Special Attack", decreased: "Attack" },
  { name: "Mild", increased: "Special Attack", decreased: "Defense" },
  { name: "Quiet", increased: "Special Attack", decreased: "Speed" },
  { name: "Bashful", increased: null, decreased: null },
  { name: "Rash", increased: "Special Attack", decreased: "Special Defense" },
  { name: "Calm", increased: "Special Defense", decreased: "Attack" },
  { name: "Gentle", increased: "Special Defense", decreased: "Defense" },
  { name: "Sassy", increased: "Special Defense", decreased: "Speed" },
  { name: "Careful", increased: "Special Defense", decreased: "Special Attack" },
  { name: "Quirky", increased: null, decreased: null },
];

export function findNature(name) {
  return natures.find((n) => n.name.toLowerCase() === name.toLowerCase()) || null;
}

export function natureModifier(nature, stat) {
  if (nature.increased === stat) return 1.1;
  if (nature.decreased === stat) return 0.9;
  return 1.0;
}
