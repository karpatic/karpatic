window.w = window;

// Description. Loads from route.js if window.toast dne.
// Requires #toast_container in the html template
// - (default: article.html)
// - (but maybe not EVERYTHING needs to be in the html)

//
//
// IMPORTANT -> Populate Template INTERACTS WITH THE TEMPLATE.
// REQUIRES
// MAX 2 NESTED LAYERS OF BREADCRUMBS
// W.TOAST for CLIPBOARD
// W.Expand for ASIDE
// W.Audio for AUDIO
// calls template.loadObserver
// toggle_sitemap

// #toggle_sitemap, #page_transition*,
// #expand, #audio, #toc, IntersectionObserver
// #title, #summary, #content, #breadcrumbs

// load_template
// Inserts template.html into body by checking data-template attribute
// Updates w.sitemap_content using ipynb json and txt from server and inserts Style for it
// Calls populateTemplate

// populateTemplate
// - breadcrumbs are at most two layers deep.
// - - it takes the directory `sm_name`, and the current page as params.
// - - template home link and the index home link must use ./../ to account for these two layers.
// - Calls createNav
// - Expand and Audio are HTML Elements that get reset.
// template.loadObserver()
// index.setRedirectListeners()
//
// template intersection observer interacts with createNav

const shorten = (str, len = 12) =>
  str.trim().slice(0, len) + (str.length > len + 1 ? "..." : "");
const capitalize = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());
const formatLink = (str) =>
  shorten(capitalize(str.replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "")));
const displayLink = (str) =>
  capitalize(str.replace(/^\d+/g, "").replaceAll("_", " "));

//
const create_url = (link, sitemap) => {
  // Relative Links comparing URI, current Meta, the desired post's Meta
  // Use in populate template and create nav
  let fromSubpath = location.pathname.split("/").length >= 3;
  let toSubpath = link != sitemap;
  let t = `./${
    (fromSubpath && !toSubpath && "../") ||
    (!fromSubpath && toSubpath && !!sitemap && sitemap + "/") ||
    ""
  }${link}`;
  // console.log({ fromSubpath, toSubpath, link, sitemap, t });
  return t;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//
// Dispatched from handleRoute
// - Used to populate the template with window.meta data and meta.content
// - Populates 'sitemap' map
// - - iff #sitemap and newTemplate (default: article)
// - Runs 'page_transition' animation if it exists in sequence w/ populateTemplate
//
w.addEventListener(
  "load_template",
  async () => {
    console.group("refresh_template:Event:LOAD_TEMPLATE");

    // Load a template on route change or local init
    w.meta.template ||= "article";
    if (meta.template !== document.body.getAttribute("data-template")) {
      let url = `/templates/${meta.template}`;
      try {
        console.log("Insert html:", url);
        document.body.setAttribute("data-template", meta.template);
        document.body.innerHTML = await (await fetch(`${url}.html`)).text();

        // Add Basic Stylesheet ;
        console.log("Insert css");
        document.body.insertAdjacentHTML(
          "beforeend",
          `<style>${await (await fetch(`${url}.css`)).text()}</style>`
        );

        // Forceload scripts. Moves main.js to footer.
        Array.from(document.getElementsByTagName("script")).forEach(
          (script) => {
            console.log("Refresh Script: ", script["src"]);
            const newScript = document.createElement("script");
            ["src", "type", "async", "textContent"].forEach(
              (attr) => script[attr] && (newScript[attr] = script[attr])
            );
            document.body.appendChild(newScript);
            script.parentNode.removeChild(script);
          }
        );
      } catch (err) {
        console.log("INJECT_SCRIPTS:ERROR:", err);
      }
    }

    // Add or Replace Sitemap Stylesheet
    let sm = location.pathname.split("/")[1].replace(".html", "") || "index";
    // Takes the first element as the sitemap name
    // exe1: /index.html -> index
    // exe2: /notes/ -> notes
    // exe2: /notes/uniquepage.html -> notes
    // exe3: /notes/2021/01/01/index.html -> notes

    if (w.sitemap && !w.meta.hide_sitemap) {
      let url = false;
      try {
        if (!w.sitemap_content) {
          url = `${location.origin}/templates/${w.meta.template}_sitemap.css`;
          console.log("Insert sitemap css", url);
          let txt = await (await fetch(url)).text();
          document.body.insertAdjacentHTML(
            "beforeend",
            `<style>${txt}</style>`
          );
        }
        if (w.sm_name != sm) {
          w.sm_name = sm;
          url = `${location.origin}/posts/${sm_name}_map.json`;
          console.log("Fetch sitemap:", url);
          w.sitemap_content = await (await fetch(url)).json();
          console.log("SITEMAP_CONTENT:", w.sitemap_content);
          let sm2 = await (await fetch(`https://carlos-a-diez.com/cms/sitemap.json`)).json();
          let filter = ["food", "life", "history"];
          // filter obj arr where obj.fileName starts with filter
          sm2 = sm2.filter((x) => filter.some((y) => x.filename.toLowerCase().startsWith(y)));
          // console.log({ sm2 }); 
          w.sitemap_content = [...w.sitemap_content, ...sm2];
        }
      } catch (e) {
        console.log("INSERT_SITEMAP:ERROR:", url, e);
      }
    }

    document.title = w.meta.title;
    // Delay poptemplte iff refresh not for an anchor link so the page animation can run to it's midpoint.
    console.groupEnd();
    populateTemplate(!w.preRendering && location.href.indexOf("#") == -1);
  },
  { passive: true }
);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const populateTemplate = async (transitionable = false) => {
  const pageT = w.page_transition;
  if (transitionable && pageT) {
    pageT.style.animation =
      "page_transition 1s alternate 2, gradient 1s alternate 2";
    pageT.addEventListener(
      "animationend",
      async () => (pageT.style.animation = "none"),
      { once: true }
    );
    setTimeout(async () => {
      let resp = await populateTemplate();
    }, 1100);
    return;
  }
  console.group("refresh_template:POPULATE_TEMPLATE");

  // Create relative hyperlinks for each fragment along the path.
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
              // create a link with the url
              x.replace(".html", "")
            )}</a>`;
      })
      .join("/"),
  ].join("/");

  console.log("Populate content, title, summary, breadcrumbs");
  ["content", "title", "summary", "breadcrumbs"].map((id) => {
    if (!meta[id]) return;
    // console.log("id", id, meta[id])
    const el = document.getElementById(id);
    el.innerHTML = "";
    // console.log("~~~~~~~~~~~~> POPULATE_TEMPLATE:", meta[id]);
    el.appendChild(document.createRange().createContextualFragment(meta[id]));
  });

  // Populate Floating Sitemap
  await createNav();

  // Give headers an anchor tag.
  console.log("Add Anchor Tags");
  [...document.querySelectorAll("h2, h3, h4")].forEach((header) => {
    header.id = formatLink(header.innerText || header.textContent);
    let anchor = document.createElement("a");
    anchor.className = "anchor";
    anchor.id = anchor.href = "#" + header.id;
    anchor.setAttribute("aria-label", "Link to " + header.id);
    anchor.setAttribute(
      "onclick",
      `event?.preventDefault?.(); navigator.clipboard.writeText('https://charleskarpati.com${
        location.pathname + location.hash
      }'); w.toast?.();`
    );
    header.parentNode.insertBefore(anchor, header.nextSibling);
  });

  // Toggle Template elements visibility
  console.log("Toggle aside Elements");
  w.expand &&
    (w.expand.style.display =
      document.getElementsByTagName("aside").length > 0 ? "block" : "none");

  // console.log(w.meta)
  if (w.audio) {
    w.audio.style.display = w.meta.audio ? "flex" : "none";
    w.audio.title = w.meta.audio;
    // get the nested audio element
    w.audio.querySelector("audio").src = w.meta.audio;
  }

  // Restart Observer on new page if included in article_lazy
  loadObserver?.();

  // Ensure unique id's
  document.querySelectorAll("a").forEach((el) => {
    el.id =
      el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000);
  });

  // Capture all relative links and attach ensure redirect event listeners are attached.
  w.setRedirectListeners?.();
  console.groupEnd();
  return true;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// IPYNB Requires: meta.{summary, filename} Optionally: meta.{hide_sitemap, toc, tab} in the YAML header.
const createNav = async () => {
  console.group("createNav");
  let currentTab = w.meta.tab || w.meta.filename;
  lbl = (x) => x.tab || x.filename;

  // Skip sitemap creation
  const skip = w.meta.hide_sitemap;
  if (w.sitemap) w.sitemap.style.visibility = skip ? "hidden" : "visible";
  if (!w.sitemap || skip) {
    console.groupEnd();
    return;
  }

  console.log("CREATE_NAV: \n\n", {
    currentTab,
    sitemap_content: w.sitemap_content,
  });

  // Create Sitemap Links
  let navLinks = w.sitemap_content.map((x) => {
    let tab = lbl(x);
    return `
  <a id="${tab == currentTab ? "currentPage" : "link_" + tab}"  
      href="${create_url(x.filename, w.sm_name)}.html" 
      title="${tab}">
      ${shorten(displayLink(tab), 20)}
  </a>`;
  });

  // Insert Links Into Container
  w.sitemap.innerHTML = `
  <label tabindex="0" for="toggle_sitemap">
      <span>&#x21e8;</span> Sitemap 
      <span>&#x2715;</span>
  </label>
  <hr/>
  <div id='sitemap-content'>
    <a id="link_Home" href="./../index.html" title="Home">Home</a>
    ${navLinks.join("")}
  </div>`;

  document.getElementById("toggle_sitemap").checked = true;
  // Toc Links

  // Skip or Continue TOC creation
  if (!("toc" in w.meta) || w.meta.toc.toLowerCase() == "false") {
    console.groupEnd();
    return;
  }

  // Create TOC Link
  // tocNode = document.createElement("div");
  // tocNode.setAttribute("id", "toc"); // for Stylesheet
  let tocNode = w["tocHere"] || w["toc"];
  console.log({ tocNode });
  tocNode.innerHTML = [...document.querySelectorAll("h2, h3, h4")]
    .map((header) => {
      let x = header.innerText || header.textContent;
      const z = formatLink(x);
      const spaces = "&emsp;".repeat(header.tagName.slice(1) - 1);
      return `${spaces}<a href='#${z}' title="${x}">${displayLink(x)}</a>`;
    })
    .join("<br/>");

  // const currentPage = w.sitemap.querySelector(`a[title="${lbl(w.meta)}"]`);
  // currentPage?.parentNode.insertBefore(tocNode, currentPage.nextSibling);

  console.groupEnd();
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Shows 'Link Copied' text for anchors.
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
