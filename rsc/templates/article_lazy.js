(async () => {
  w.loadStyleOnce ||
    document.body.insertAdjacentHTML(
      "beforeend",
      `<style>${await (
        await fetch(w.location.origin + `/templates/article_lazy.css`)
      ).text()}</style>`
    );
  w.loadStyleOnce = true;
})();

window.rir = (min, max) =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);

// Footer Background Animation
function generatePath(bars) {
  const h = 200;
  const addPath = (x, y) => `L${Math.round((x * window.width) / bars)},${y}`;
  const path = Array.from({ length: bars }, (y, x) => {
    y = h - rir(2, 5) * 40;
    return addPath(x, y) + addPath(x + 1, y);
  });
  return (
    "M0," +
    h +
    path.join("") +
    addPath(bars, h) +
    "L0," +
    h +
    "Z"
  ).replace("undefined", "");
}
function updatePath() { 
  const newPath = "path('" + generatePath(6) + "')";
  const footer = document.getElementById("footer_bg").style;
  // set css var --path2 to --path1's computed value and update --path1 with new path(d)
  const pastPath = getComputedStyle(document.documentElement).getPropertyValue(
    "--path1"
  );
  footer.clipPath = pastPath;
  // Using css vars helps ensure auto-prefixing is done correctly
  document.documentElement.style.setProperty("--path1", newPath);
  document.documentElement.style.setProperty("--path2", pastPath || newPath);
  //Fix for Glitchy animation Otherwise flashes end of animation before starting again.
  footer.animation = "none";
  setTimeout(() => {
    footer.animation = "footer-bars 1000ms forwards";
  }, 100);
}
window.width = Math.min(window.innerWidth, 800);
updatePath();
setInterval(updatePath, 1500);