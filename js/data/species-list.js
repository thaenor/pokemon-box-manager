export const speciesList = [
  { id: 1, name: "Wigglytuff", showdownId: "wigglytuff", types: ["Normal", "Fairy"], isMega: false, isUltra: false },
  { id: 2, name: "Persian", showdownId: "persian", types: ["Normal"], isMega: false, isUltra: false },
  { id: 3, name: "Alolan Persian", showdownId: "persian-alola", types: ["Dark"], isMega: false, isUltra: false },
  { id: 4, name: "Farfetch'd", showdownId: "farfetchd", types: ["Normal", "Flying"], isMega: false, isUltra: false },
  { id: 5, name: "Mr. Mime", showdownId: "mr-mime", types: ["Psychic", "Fairy"], isMega: false, isUltra: false },
  { id: 6, name: "Swalot", showdownId: "swalot", types: ["Poison"], isMega: false, isUltra: false },
  { id: 7, name: "Salamence", showdownId: "salamence", types: ["Dragon", "Flying"], isMega: false, isUltra: false },
  { id: 8, name: "Gogoat", showdownId: "gogoat", types: ["Grass"], isMega: false, isUltra: false },
  { id: 9, name: "Golisopod", showdownId: "golisopod", types: ["Bug", "Water"], isMega: false, isUltra: false },
  { id: 10, name: "Rillaboom", showdownId: "rillaboom", types: ["Grass"], isMega: false, isUltra: false },
  { id: 11, name: "Cinderace", showdownId: "cinderace", types: ["Fire"], isMega: false, isUltra: false },
  { id: 12, name: "Inteleon", showdownId: "inteleon", types: ["Water"], isMega: false, isUltra: false },
  { id: 13, name: "Thievul", showdownId: "thievul", types: ["Dark"], isMega: false, isUltra: false },
  { id: 14, name: "Toxtricity (Amped)", showdownId: "toxtricity", types: ["Electric", "Poison"], isMega: false, isUltra: false },
  { id: 15, name: "Toxtricity (Low Key)", showdownId: "toxtricity-low-key", types: ["Electric", "Poison"], isMega: false, isUltra: false },
  { id: 16, name: "Grapploct", showdownId: "grapploct", types: ["Fighting"], isMega: false, isUltra: false },
  { id: 17, name: "Perrserker", showdownId: "perrserker", types: ["Steel"], isMega: false, isUltra: false },
  { id: 18, name: "Sirfetch'd", showdownId: "sirfetchd", types: ["Fighting"], isMega: false, isUltra: false },
  { id: 19, name: "Pincurchin", showdownId: "pincurchin", types: ["Electric"], isMega: false, isUltra: false },
  { id: 20, name: "Indeedee (Male)", showdownId: "indeedee-male", pokeApiName: "indeedee", types: ["Psychic", "Normal"], isMega: false, isUltra: false },
  { id: 21, name: "Indeedee (Female)", showdownId: "indeedee", pokeApiName: "indeedee-female", types: ["Psychic", "Normal"], isMega: false, isUltra: false },
  { id: 22, name: "Pawmot", showdownId: "pawmot", types: ["Electric", "Fighting"], isMega: false, isUltra: false },
  { id: 23, name: "Arboliva", showdownId: "arboliva", types: ["Grass", "Normal"], isMega: false, isUltra: false },
  { id: 24, name: "Squawkabilly (Green)", showdownId: "squawkabilly", types: ["Normal", "Flying"], isMega: false, isUltra: false },
  { id: 25, name: "Squawkabilly (Blue)", showdownId: "squawkabilly-blue", types: ["Normal", "Flying"], isMega: false, isUltra: false },
  { id: 26, name: "Squawkabilly (Yellow)", showdownId: "squawkabilly-yellow", types: ["Normal", "Flying"], isMega: false, isUltra: false },
  { id: 27, name: "Squawkabilly (White)", showdownId: "squawkabilly-white", types: ["Normal", "Flying"], isMega: false, isUltra: false },
  { id: 28, name: "Mabosstiff", showdownId: "mabosstiff", types: ["Dark"], isMega: false, isUltra: false },
  { id: 29, name: "Baxcalibur", showdownId: "baxcalibur", types: ["Dragon", "Ice"], isMega: false, isUltra: false },
  { id: 30, name: "Mega Salamence", showdownId: "salamence-mega", types: ["Dragon", "Flying"], isMega: true, isUltra: false },
  { id: 31, name: "Mega Golisopod", showdownId: "golisopod-mega", types: ["Bug", "Water"], isMega: true, isUltra: false },
  { id: 32, name: "Mega Baxcalibur", showdownId: "baxcalibur-mega", types: ["Dragon", "Ice"], isMega: true, isUltra: false },
  { id: 33, name: "Mega Absol Z", showdownId: "absol-ultra", types: ["Dark"], isMega: false, isUltra: true },
  { id: 34, name: "Mega Garchomp Z", showdownId: "garchomp-ultra", types: ["Dragon", "Ground"], isMega: false, isUltra: true },
  { id: 35, name: "Mega Lucario Z", showdownId: "lucario-ultra", types: ["Fighting", "Steel"], isMega: false, isUltra: true },
];

export function findSpecies(name) {
  const search = name.toLowerCase().trim();
  return speciesList.find(
    (s) => s.showdownId.toLowerCase() === search || s.name.toLowerCase() === search
  );
}