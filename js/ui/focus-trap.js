/**
 * Focus trap utility — save and restore focus, trap Tab within a container.
 */

/**
 * Save the currently focused element for later restoration.
 * @returns {Function} — call to restore focus
 */
export function saveFocus() {
  const prev = document.activeElement;
  return () => {
    if (prev && prev.focus) prev.focus();
  };
}

/**
 * Trap Tab/Shift+Tab within a container element.
 * @param {HTMLElement} container — element to trap focus within
 * @param {KeyboardEvent} e — the keydown event
 */
export function trapTab(container, e) {
  const focusable = container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}