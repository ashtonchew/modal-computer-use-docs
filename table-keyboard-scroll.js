(() => {
  const scrollStep = 48;

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const target = event.target;
    if (!target || typeof target.closest !== "function") return;

    const region = target.closest('[role="region"]');
    if (!region?.querySelector("table")) return;
    if (region.scrollWidth <= region.clientWidth) return;

    // Mintlify focuses responsive table regions but leaves horizontal arrow keys to the page.
    region.scrollBy({
      left: event.key === "ArrowRight" ? scrollStep : -scrollStep,
      behavior: "auto",
    });
    event.preventDefault();
  });
})();
