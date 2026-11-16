// Read the same appearance preference as the main reading app.
(() => {
  function applyTheme() {
    let theme;
    try {
      theme = JSON.parse(localStorage.getItem("daily5-bible-v1") || "null")?.settings?.theme;
    } catch { /* A new device can follow its system appearance. */ }
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }

  applyTheme();
  window.addEventListener("pageshow", applyTheme);
  window.addEventListener("storage", ({ key }) => {
    if (key === "daily5-bible-v1" || key === null) applyTheme();
  });
})();
