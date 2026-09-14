/**
 * Toast Notification System — singleton for showing micro-toasts.
 *
 * Usage: showToast("Saved!", "success")  // auto-dismisses after 3s
 *        showToast("Error!", "error", 5000)  // custom duration
 *        showToast("Loading...", "info", 0)  // sticky (pass 0 or omit duration for default 3000)
 */

const ICONS = {
  success: "✓",
  error: "✗",
  info: "ℹ",
};

/** Ensure the toast container exists. */
function getContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message — text content
 * @param {"success"|"error"|"info"} [type="info"] — visual variant
 * @param {number} [duration=3000] — ms before auto-dismiss (0 = sticky)
 */
export function showToast(message, type = "info", duration = 3000) {
  const container = getContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "alert");

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.textContent = ICONS[type] || ICONS.info;
  toast.appendChild(icon);

  const text = document.createElement("span");
  text.className = "toast__text";
  text.textContent = message;
  toast.appendChild(text);

  container.appendChild(toast);

  // Dismiss logic
  let dismissTimer = null;
  let isDismissing = false;

  function dismiss() {
    if (isDismissing) return;
    isDismissing = true;
    if (dismissTimer) clearTimeout(dismissTimer);
    toast.classList.add("toast--dismissing");
    toast.addEventListener(
      "animationend",
      () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      },
      { once: true },
    );
  }

  if (duration > 0) {
    dismissTimer = setTimeout(dismiss, duration);
  }

  // Dismiss on click
  toast.addEventListener("click", dismiss);
}
