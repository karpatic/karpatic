window.w = window;

const shorten = (str, len = 12) =>
  str.trim().slice(0, len) + (str.length > len + 1 ? "..." : "");
const capitalize = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());
const formatLink = (str) =>
  shorten(capitalize(str.replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "")));
const displayLink = (str) => shorten(capitalize(str.replaceAll("_", " ")), 20);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//
// Dispatched from handleRoute
// - Used to populate the template with window.meta data
// - Populates 'sitemap' map
// - - iff #sitemap and newTemplate
// - - Populates the #currentPage TOC by scanning for H2s, H3s, etc.
// - Runs 'page_transition' animation if it exists
//
w.addEventListener(
  "refreshTemplate",
  async () => {
    console.log("~~~~~~~~> refreshTemplate");
    document.title = w.meta.title;
    // Delay populateTemplate iff refresh not for an anchor link
    const pageT = w.page_transition;
    if (!w.preRendering && location.href.indexOf("#") == -1 && pageT) {
      pageT.style.animation =
        "page_transition 1s alternate 2, gradient 1s alternate 2";
      pageT.addEventListener(
        "animationend",
        async () => (pageT.style.animation = "none"),
        { once: true }
      );
      setTimeout(async () => populateTemplate(), 1100);
    } else {
      populateTemplate();
    }
  },
  { passive: true }
);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const populateTemplate = async () => {
  console.log("~~~~~~~~~~> populateTemplate");

  // Create relative hyperlinks for each
  // location.pathname.split("/").split("/").slice(1).map( (x,i) => {return '../'.repeat(i)+x } )
  meta.breadcrumbs = [
    `<a href="./../index.html">Home</a>`,
    location.pathname
      .split("/")
      .slice(1)
      .map((x, i) => {
        x = x.replace(".html", "");
        return x == "index"
          ? ""
          : `<a href=${create_url(x, w.sm_name)}.html>${capitalize(
              x.replace(".html", "")
            )}</a>`;
      })
      .join("/"),
  ].join("/");
  ["content", "title", "summary", "breadcrumbs"].map((id) => {
    if (!meta[id]) return;
    const el = document.getElementById(id);
    el.innerHTML = "";
    el.appendChild(document.createRange().createContextualFragment(meta[id]));
  });

  // Populate Floating Sitemap
  await createNav();

  // Give headers an anchor tag.
  [...document.querySelectorAll("h2, h3, h4")].forEach((header) => {
    header.id = formatLink(header.innerText || header.textContent);
    let anchor = document.createElement("a");
    anchor.className = "anchor";
    anchor.id = anchor.href = "#" + header.id;
    anchor.setAttribute("aria-label", "Link to " + header.id);
    anchor.setAttribute(
      "onclick",
      `navigator.clipboard.writeText('https://charleskarpati.com${
        location.pathname + location.hash
      }'); w.toast?.();`
    );
    header.parentNode.insertBefore(anchor, header.nextSibling);
  });

  // Toggle Template elements visibility
  w.expand &&
    (w.expand.style.display =
      document.getElementsByTagName("aside").length > 0 ? "block" : "none");

  // Restart Observer on new page if included in article_lazy
  loadObserver?.();

  // Ensure unique id's
  document.querySelectorAll("a").forEach((el) => {
    el.id =
      el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000);
  });

  // updateRedirectListeners for relative hyperlinks
  document
    .querySelectorAll('a[href^="./"]')
    .forEach((l) =>
      [l.removeEventListener, l.addEventListener].forEach((f) =>
        f.call(l, "click", redirect)
      )
    );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// IPYNB Requires: {summary, filename} Optionally: {hide_sitemap, tab} in the YAML header.
const createNav = async () => {
  console.log("~~~~~~~~~~~~> createNav");
  tab = (x) => x.tab || x.filename;

  // Skip or Continue sitemap creation
  const skip = w.meta.hide_sitemap;
  if (w.sitemap) w.sitemap.style.visibility = skip ? "hidden" : "visible";
  if (!w.sitemap || skip) return;

  // Create Page links
  w.sitemap.innerHTML = `
      <label tabindex="0" for="toggle_sitemap">
          <span>&#x21e8;</span> Sitemap 
          <span>&#x2715;</span>
      </label>
      <hr/>
      <div id='sitemap-content'>
        <a id="link_Home" href="./../index.html" title="Home">Home</a>${w.sitemap_content
          .map(
            (x) => `
          <a id="${tab(x) == w.meta.tab ? "currentPage" : "link_" + tab(x)}" 
              id='link_${tab(x)}' 
              href="${create_url(x.filename, w.sm_name)}.html" 
              title="${tab(x)}">
              ${displayLink(tab(x))}
          </a>`
          )
          .join("")} </div>`;

  // Skip or Continue TOC creation
  if (!("toc" in w.meta) || w.meta.toc.toLowerCase() == "false") return;

  // Find all headers and add them to the sitemap directly under the current page's link.
  tocNode = document.createElement("div");
  tocNode.setAttribute("id", "toc"); // for Stylesheet
  tocNode.innerHTML = [...document.querySelectorAll("h2, h3, h4")]
    .map((header) => {
      const z = formatLink(header.innerText || header.textContent);
      const spaces = "&emsp;".repeat(header.tagName.slice(1) - 1);
      return `${spaces}<a href='#${z}'>${displayLink(z)}</a>`;
    })
    .join("<br/>");

  const currentPage = w.sitemap.querySelector(`a[title="${tab(w.meta)}"]`);
  currentPage?.parentNode.insertBefore(tocNode, currentPage.nextSibling);
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Relative Links comparing URI, current Meta, the desired post's Meta
let create_url = (link, sitemap) => {
  let fromSubpath = location.pathname.split("/").length >= 3;
  let toSubpath = link != sitemap;
  let t = `./${
    (fromSubpath && !toSubpath && "../") ||
    (!fromSubpath && toSubpath && sitemap + "/") ||
    ""
  }${link}`;
  // console.log({ fromSubpath, toSubpath, link, sitemap, t });
  return t;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

w.toast = () => {
  let e = document.getElementById("toast_container");
  e.style.animation = "toast 3s";
  e.addEventListener(
    "animationend",
    () => {
      e.style.animation = "none";
    },
    { once: true }
  );
};
