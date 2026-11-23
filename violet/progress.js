// One counter per species on this device. Unpinning a Pokémon keeps its count.
export const progressPrefix = "violet-companion:progress:";
const unsavedCounts = new Map();

export function readCount(id, goal) {
  if (unsavedCounts.has(id)) return unsavedCounts.get(id);
  try {
    const value = Number(localStorage.getItem(progressPrefix + id));
    return Number.isSafeInteger(value) ? Math.max(0, Math.min(goal, value)) : 0;
  } catch {
    return 0;
  }
}

export async function changeCount(id, goal, update) {
  const key = progressPrefix + id;
  function save() {
    const count = Math.max(0, Math.min(goal, update(readCount(id, goal))));
    try {
      localStorage.setItem(key, String(count));
      unsavedCounts.delete(id);
      return { count, saved: true };
    } catch {
      unsavedCounts.set(id, count);
      return { count, saved: false };
    }
  }

  // Serialize taps from different tabs so both increments are counted.
  if (navigator.locks?.request) {
    try {
      return await navigator.locks.request(key, save);
    } catch {
      // File previews and some private browsing modes restrict Web Locks.
    }
  }
  return save();
}
