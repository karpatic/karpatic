window.w = window; 

// Description: Generates the page. Used in Prerender. 
// Any Elements and JS applied during prerendering will be preserved for final build 
// - This has previously been a problem because of the page transition css was triggering onload in prod (expected in dev).
// 1. refresh evt: Loads template, handles transition timing, then populates page
// 2. populateTemplate: Populates template elements, breadcrumbs, toc, sitemap 
 

// Gets the sitemap name from the first path segment:
// index.html -> "index" || /notes/ -> "notes" ||  /notes/uniquepage.html -> "notes" || /notes/2021/01/01/index.html -> "notes"

const getsmname = () => location.pathname.split("/")[1].replace(".html", "") || "index";
const shorten = (str, len = 12) => str?.trim().slice(0, len) + (str?.length > len + 1 ? "..." : "");
const capitalize = (str) => str?.replace(/\b\w/g, (c) => c.toUpperCase());
const formatLink = (str) => shorten(capitalize(str?.replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "")));
const displayLink = (str) => capitalize(str.toLowerCase().replace(getsmname() + '_', '').replace(/^\d+/g, "").replaceAll("_", " "));

// Creates relative URLs to target 
const create_url = (link, sitemap) => { 
  // Remove sitemap prefix from link (e.g., "notes_page" -> "page")
  link = link.replace(new RegExp(`^${sitemap}_`, 'i'), ''); 
  
  // Determine if we're navigating from/to a subdirectory
  let fromSubpath = location.pathname.split("/").length >= 3;
  let toSubpath = link != sitemap;
  
  // Build relative path: "../" to go up, "sitemap/" to go down, or "./" to stay at same level
  let t = `./${
    (fromSubpath && !toSubpath && "../") ||
    (!fromSubpath && toSubpath && !!sitemap && sitemap + "/") ||
    ""
  }${link}`;
  return t;
}; 
 
// Load template HTML/CSS and refresh scripts
// 1. Injects template HTML/CSS if changed. 
// 2. Re-injects and refreshes all script tags 
// 3. Handles transition timing
// 4. Populates page content
const refresh = async () => {
  console.group("refresh_template:refresh");

  await animatePageTransition(); 
  await fetchAndInjectTemplate(); 
  await populateTemplateElements();
  await updateBreadcrumbs();
  await updateUtilityButtons();

  // Prepare TOC. Uses #tocHere 1st, #toc 2nd. 
  const hide_toc = w.meta.hide_toc?.toLowerCase() == "true";
  let toc = !hide_toc && await buildToc();  
  let tocNode = w["tocHere"] || w["toc"]; 
  if(tocNode) tocNode.style.display = toc ? "block" : "none";
  if(tocNode) tocNode.innerHTML = toc || "";

  // Prepare Sitemap
  const hide_sitemap = !w.sitemap || w.meta.hide_sitemap?.toLowerCase() == "true"; 
  w.sitemap.style.visibility = hide_sitemap ? "hidden" : "visible";
  w.sitemap.innerHTML = hide_sitemap ? "" : await createSitemap();

  // Insert TOC -> Inserts into Sitemap if 
  if (!hide_sitemap && !tocNode && toc) w['nav-toc'].innerHTML = `
    <input type="checkbox" id="toggle_toc" class="toc-toggle" />
    <label class="toc-label" for="toggle_toc">
      Table of Contents → 
    </label>
    <label class="toc-label-back" for="toggle_toc">
      ← Back to Navigation
    </label>
    <div id='toc-content'> 
      <h3>Table of Contents</h3>
      ${toc} 
    </div>
  `;
  
  // inject into sitemap if !tocNode but also !hide_toc.
 
  // Things w Side Effects done very last. 
  await forceReloadScripts(); 
  w.setRedirectListeners?.();
  w.loadObserver?.(); 
  console.groupEnd(); 
};

w.addEventListener( "refresh", refresh );
  

const fetchAndInjectTemplate = async () => {
  w.meta.template ||= "article";
  
  const needsLoading = meta.template !== document.body.getAttribute("data-template");
  if (!needsLoading) return false;
  let url = `/rsc/templates/${w.meta.template}`;
  try {
    document.body.setAttribute("data-template", w.meta.template);
    document.body.innerHTML = await (await fetch(`${url}.html`)).text(); 
    document.body.insertAdjacentHTML("beforeend",`<style>${await (await fetch(`${url}.css`)).text()}</style>`
    );
  } catch (err) {
    console.log("INJECT_TEMPLATE:ERROR:", err);
  } 
  return true
};

// Forceload scripts. Moves main.js to footer.
const forceReloadScripts = async () => { 
  Array.from(document.getElementsByTagName("script")).forEach(
    (script) => { 
      const newScript = document.createElement("script");
      ["src", "type", "async", "textContent"].forEach(
        (attr) => script[attr] && (newScript[attr] = script[attr])
      ); 
      script.parentNode.removeChild(script); 
      try{
      document.body.appendChild(newScript); 
      }catch(e){console.log("FORCERELOADSCRIPTS ERROR:", e)}
    }
  ); 
};
  

// Populate helpers split from former populateTemplate
const populateTemplateElements = async () => {
  const insert = ["content", "title", "summary"];
  insert.forEach((id) => {
    if (!meta[id]) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    el.appendChild(document.createRange().createContextualFragment(meta[id]));
  });
};

// Runs page transition animation and resolves at midpoint (≈450ms)
// Animation runs twice (alternate 2) at 375ms each = 750ms total
const animatePageTransition = async () => {
  const transitionable = !w.preRendering && location.href.indexOf("#") == -1 && w.page_transition;
  const skipTransition = w.meta.hide_transition?.toLowerCase() == "true";
  if(!transitionable | skipTransition ) return;
  console.log("animatePageTransition");
  const pageT = w.page_transition;
  pageT.style.animation =
    "page_transition 0.375s alternate 2, gradient 0.375s alternate 2";
  pageT.addEventListener(
    "animationend",
    async () => (pageT.style.animation = "none"),
    { once: true }
  );
  // Wait until the midpoint before returning
  await new Promise((resolve) => setTimeout(resolve, 450));
};

const updateBreadcrumbs = async () => {
  if (!w.breadcrumbs) return;
  const hide = w.meta.hide_breadcrumbs?.toLowerCase() == "true";
  w.breadcrumbs.style.display = hide ? "none" : "block";
  if (!hide) meta.breadcrumbs = w.breadcrumbs.innerHTML = await createBreadcrumbs();
};

// Generates breadcrumb navigation from current URL path
// Example: /notes/mypage.html -> /Home, /Notes, /Notes/Mypage
const createBreadcrumbs = async () => { 
  const parts = location.pathname.split("/").filter(Boolean).map(p => p.replace(".html", ""));
  const depth = parts.length; // e.g., ["blog","aboutmysite"] => depth 2
  const sm = parts[0] || "index";

  const homeHref = depth > 1 ? "./../index.html" : "./index.html";

  const trail = parts
    .map((x, i) => {
      if (!x || x === "index") return "";
      // Section level (first segment): ../<section>.html when deeper than section
      if (i === 0) {
        const href = depth > 1 ? `./../${sm}.html` : `./${sm}.html`;
        return `<a href="${href}">${capitalize(x)}</a>`;
      }
      // Current page or deeper segment: ./<name>.html
      return `<a href="./${x}.html">${capitalize(x)}</a>`;
    })
    .filter(Boolean)
    .join("/");

  return [`<a href="${homeHref}">Home</a>`, trail].filter(Boolean).join("/");
};


// Finds all h2, h3, h4 headers and adds anchor links for deep linking
// Anchor links copy the full URL to clipboard when clicked and show a toast notification
// Returns array of heading data: [{id, text, level}, ...]
const getTocContent = async () => {
  let headers = [...document.querySelectorAll("h2, h3, h4")];
  headers = headers
    .map((header) => {
      const text = (header.innerText || header.textContent || "").trim();
      if (!text) return null;
      const id = formatLink(text);
      header.id = id;

      let anchor = header.nextElementSibling;
      if (!anchor || !anchor.classList?.contains("anchor")) {
        anchor = document.createElement("a");
        anchor.className = "anchor";
        header.parentNode.insertBefore(anchor, header.nextSibling);
      }

      anchor.id = anchor.href = "#" + header.id;
      anchor.setAttribute("aria-label", "Link to " + header.id);
      anchor.setAttribute(
        "onclick",
        `event?.preventDefault?.(); navigator.clipboard.writeText('https://charleskarpati.com${
          location.pathname + '#' + header.id
        }'); w.toast?.();`
      ); 
      
      return {
        id,
        text,
        level: Number(header.tagName.slice(1)),
      };
    })
  .filter(Boolean);
  
  // Ensure all <a> tags have unique IDs
  document.querySelectorAll("a").forEach((el) => {
    el.id = el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000);
  });

  return headers
}; 

const buildToc = async () => {
  console.group("buildToc");

  const headings = await getTocContent();

  // Build TOC HTML
  const toc = headings
    .map(({ id, text, level }) => {
      const depth = level - 1;
      const layer = depth > 1 ? ` layer-${depth}` : "";
      return `<a class='toc-link toc-link${layer}' href='${location.pathname.split("#")[0]}#${id}' 
    onclick="event.preventDefault(); redirect(event);" title="${text}">${displayLink(text)}</a>`;
    })
    .join("");

  console.groupEnd();
  return toc;
};

// Shows 'Link Copied' notification via CSS animation
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
 
const updateUtilityButtons = async () => {
  if (w.expand) {
    w.expand.style.display = document.getElementsByTagName("aside").length > 0 ? "block" : "none";
  }
  if (w.audio) {
    w.audio.style.display = w.meta.audio ? "flex" : "none";
    w.audio.title = w.meta.audio;
    const nested = w.audio.querySelector("audio");
    if (nested) nested.src = w.meta.audio;
  }
};  
 

// Load sitemap css, and merges local JSON sitemap with remote CMS data
const getSitemapInfo = async () => {
  let sm = getsmname(); 
  const cont = w.sitemap && w.meta.hide_sitemap?.toLowerCase() != "true";
  if (cont) { 
    if (!w.sitemap_content) {
      const url = `/rsc/templates/${w.meta.template}_sitemap.css`;
      let txt = await (await fetch(url)).text();
      document.body.insertAdjacentHTML("beforeend", `<style>${txt}</style>`);
    }  
    if (w.sm_name == sm) {
      return 
    } 
  }
  else{ return }
  w.sm_name = sm; 
  
  // Fetches sitemap content from local JSON and remote CMS, then merges them 
  const url = `/rsc/posts/${sm}_map.json`; 
  let localContent = await (await fetch(url)).json();
  
  let remoteContent = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    remoteContent = await (
      await fetch(`https://carlos-a-diez.com/cms/notes.json`, {
        signal: controller.signal,
      })
    ).json();
    clearTimeout(timeoutId);
  } catch {
    remoteContent = [];
  }
  
  // Filters remote CMS data for entries matching current sitemap section (e.g., "notes_*") and merges them in.
  const filteredRemote = !remoteContent
    ? []
    : Object.values(remoteContent).filter((x) => {
        let flag = x.filename
          .toLowerCase()
          .startsWith(sm.toLowerCase() + '_');
        return !flag
          ? false
          : {
              filename: x.filename || "Unknown",
              summary: x.summary || "Unknown",
            };
      }); 
  
  w.sitemap_content =  [...localContent, ...filteredRemote]; 
  return w.sitemap_content;
};
 

// Generates sitemap using w.sitemap_content and may also include the TOC if the HTML given
const createSitemap = async () => {
  console.group("createSitemap");
  await getSitemapInfo()
  const sitemap = `
    <input type="checkbox" id="toggle_sitemap" class="nav-toggle" />
    <label tabindex="0" for="toggle_sitemap" class="nav-label">
      <span class="nav-arrow">&#x21e8;</span> Navigation 
      <span class="nav-close">&#x2715;</span>
    </label>
    <hr/>
    <a id="link_Home" href="./../index.html" title="Home">Home</a>
    <div id="nav-toc"></div>
    <div id='sitemap-content'>  
    ${(w.sitemap_content || []).map((x, i) => {
      // First entry (i===0) is wrapped in h3 tag for section heading
      let tab = x.tab || x.filename; 
      let content = `
        <a id="${x.filename == w.meta.filename ? "currentPage" : "link_" + tab}"  
            href="${create_url(x.filename, w.sm_name)}.html" 
            title="${tab}">
            ${shorten(displayLink(tab), 20)}
        </a>`; 
        return i === 0 ? `<h3>${content}</h3>` : content;
  }).join("")} 
    </div>`;
  console.groupEnd(); 
  return sitemap;
};
// TODO: read in yaml from markdown.

// todo: make toast notification for more than just copied links.
// import { create } from "handlebars";
// the path handlers need updating to use ./docs/ for prod and ./ paths in dev. 

// todo hide_sitemap should not need to use w.sitemap_content in logic because that is obtained in prepareSitemap.
// maybe if not hide_sitemap then prepareSitemap and set w.sitemap_content there to then be checked for continuing.

// document.getElementById("toggle_sitemap").checked = true; -> move to route fn


// CSS duplication: in prepareSitemap, loading CSS is gated on w.sitemap_content. Track separately.
// Breadcrumbs: use new URL() + stable rules for /index.html and trailing slashes; avoid string splits where possible.
// Unique IDs: don’t randomize every <a>; restrict to headings or known TOC targets. Random IDs break deep links across renders. For headings, formatLink(text) is enough if you dedupe within the page.
// Default empty sitemap fallback