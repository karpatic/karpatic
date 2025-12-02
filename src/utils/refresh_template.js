window.w = window; 

// Description: Generates the page. Used in Prerender. 
// Any Elements and JS applied during prerendering will be preserved for final build 
// - This has previously been a problem because of the page transition css was triggering onload in prod (expected in dev).
// 1. load_template evt: Loads template, calls create sitemap/ toc and then createPage
// 2. createPage: Handles page transitions, populates template elements 
 

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
// 4. Calls createPage to populate content
const loadTemplate = async () => {
  console.group("refresh_template:loadTemplate"); 

  // Load a template on route change or local init
  w.meta.template ||= "article";
  if (meta.template !== document.body.getAttribute("data-template")) {
    let url = `/rsc/templates/${meta.template}`;
    try {
      document.body.setAttribute("data-template", meta.template);
      document.body.innerHTML = await (await fetch(`${url}.html`)).text(); 
      document.body.insertAdjacentHTML("beforeend",`<style>${await (await fetch(`${url}.css`)).text()}</style>`
      );

      // Forceload scripts. Moves main.js to footer.
      Array.from(document.getElementsByTagName("script")).forEach(
        (script) => {
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

  console.groupEnd(); 

  let transitionable = !w.preRendering && location.href.indexOf("#") == -1 && w.page_transition;
  let skip = w.meta.hide_transition?.toLowerCase() == "true";  
  createPage( transitionable && !skip );
};
 

w.addEventListener( "load_template", loadTemplate, { passive: true } );

// AnimatePageTransition, populate template, createBreadcrumbs, createToc, PrepareSitemap, createSitemap 
const createPage = async (transitionable = false) => { 
  console.group("refresh_template:populateTemplate"); 

  // Page Transition: If enabled, run animation first reruns createPage at midpoint
  if ( transitionable && !w.preRendering) {
    console.log('Transitionable Page - Skipping populateTemplate until animation midpoint.');
    console.groupEnd(); 
    await animatePageTransition();
    return;
  } 

  document.title = w.meta?.title;

  // Populate Template Elements
  let insert = ["content", "title", "summary"]; 
  insert.map((id) => {
    if (!meta[id]) return;
    const el = document.getElementById(id);
    el.innerHTML = "";
    el.appendChild(document.createRange().createContextualFragment(meta[id]));
  });  


  // Breadcrumbs
  if( w.breadcrumbs ){
    const hide_breadcrumbs = w.meta.hide_breadcrumbs?.toLowerCase() == "true"; 
    w.breadcrumbs.style.display = hide_breadcrumbs ? "none" : "block";
    !hide_breadcrumbs && (meta.breadcrumbs = w.breadcrumbs.innerHTML = await createBreadcrumbs()); 
  }

  // Create TOC and then maybe insert into Sitemap
  const hide_sitemap = w.meta.hide_sitemap?.toLowerCase() == "true" || !w.sitemap_content; 
  const hide_toc = w.meta.hide_toc?.toLowerCase() == "true";

  // TOC
  let toc = !hide_toc && createToc(); 
  let tocNode = w["tocHere"] || w["toc"]; 
  if (tocNode) {
    tocNode.style.display = hide_toc ? "none" : "block";
    if (!hide_sitemap && !hide_toc) tocNode.innerHTML = toc;
  }
  
  // Sitemap 
  if (w.sitemap) {
    await prepareSitemap();  
    w.sitemap.style.visibility = hide_sitemap ? "hidden" : "visible";
    w.sitemap.innerHTML = hide_sitemap ? "" : createSitemap(!tocNode && toc);
    document.getElementById("toggle_sitemap").checked = true;
  } 

  // Expand All Button
  w.expand &&
    (w.expand.style.display =
      document.getElementsByTagName("aside").length > 0 ? "block" : "none");

  // Play Audio Button
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

  // Attach redirect event listeners to all relative links
  // Note: Variables isLocalDev and isInitialLoad are defined but not used
  // setRedirectListeners() is called unconditionally
  let isLocalDev = !w.preRendering && w.isLocal; 
  let isInitialLoad = w.oldRoute == w.newRoute;
  if( isLocalDev ){  
      w.setRedirectListeners();
  }
  else{ 
    w.setRedirectListeners();
  }  
  console.groupEnd();
  return true;
};



// Load sitemap css, and merges local JSON sitemap with remote CMS data
const prepareSitemap = async () => {
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
};
 

// Runs page transition animation, then calls createPage at animation midpoint (450ms)
// Animation runs twice (alternate 2) at 375ms each = 750ms total
const animatePageTransition = async () => {
  console.log("animatePageTransition");
  const pageT = w.page_transition;
  pageT.style.animation =
    "page_transition 0.375s alternate 2, gradient 0.375s alternate 2";
  pageT.addEventListener(
    "animationend",
    async () => (pageT.style.animation = "none"),
    { once: true }
  );
  // Call createPage at midpoint (450ms) without transitionable flag
  setTimeout(async () => {
    let resp = await createPage();
  }, 450);
};

// Generates breadcrumb navigation from current URL path
// Example: /notes/mypage.html -> Home / Notes / Mypage
const createBreadcrumbs = async () => { 
  return [
    `<a href="/index.html">Home</a>`,
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
}; 


// Finds all h2, h3, h4 headers and adds anchor links for deep linking
// Anchor links copy the full URL to clipboard when clicked and show a toast notification
// Returns array of heading data: [{id, text, level}, ...]
const ensureAnchoredHeadings = () => {
  const headers = [...document.querySelectorAll("h2, h3, h4")];
  return headers
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
}; 

// Generates Table of Contents HTML from page headings
// Returns empty string if hide_toc is true or no headings found
// Each TOC link includes styling based on heading depth (layer-2, layer-3, etc.)
const createToc = () => {
  console.group("createToc");

  const headingData = ensureAnchoredHeadings();

  // Skip TOC creation if explicitly hidden
  const skip = w.meta.hide_toc?.toLowerCase() == "true";
  if ( skip ) {
    console.groupEnd();
    return '';
  }

  const headings = headingData.length ? headingData : ensureAnchoredHeadings();
  if (!headings.length) {
    console.groupEnd();
    return '';
  } 

  let toc = headings
    .map(({ id, text, level }) => {
      const depth = level - 1;
      const layer = depth > 1 ? ` layer-${depth}` : "";
      return `<a class='toc-link toc-link${layer}' href='${location.pathname.split("#")[0]}#${id}' 
    onclick="event.preventDefault(); redirect(event);" title="${text}">${displayLink(text)}</a>`;
    })
    .join(""); 
 
  console.groupEnd();
  return toc

};

// Generates sitemap using w.sitemap_content and may also include the TOC if the HTML given
const createSitemap = (toc = false) => {
  console.group("createSitemap");
  const sitemap = `
    <input type="checkbox" id="toggle_sitemap" class="nav-toggle" />
    <label tabindex="0" for="toggle_sitemap" class="nav-label">
      <span class="nav-arrow">&#x21e8;</span> Navigation 
      <span class="nav-close">&#x2715;</span>
    </label>
    <hr/>
    <a id="link_Home" href="./../index.html" title="Home">Home</a>
    ${(!toc) ? "" : `
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
    `}
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


// todo: open the toast notification for more than copied links.
// import { create } from "handlebars";