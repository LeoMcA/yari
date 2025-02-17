window.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLAnchorElement) {
    if (target.href.startsWith("http")) {
      event.preventDefault();
      window.parent.open(target.href);
    }
  }
});
