window.w = window;

const shorten = (str, len = 12) => str.trim().slice(0, len) + (str.length > len + 1 ? "..." : "");
const capitalize = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());
const formatLink = (str) => shorten(capitalize(str.replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "")));
const displayLink = (str) => capitalize(str.replace(/^\d+/g, "").replaceAll("_", " "));

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
// - Used to populate the template with window.meta data
// - Populates 'sitemap' map
// - - iff #sitemap and newTemplate
// - - Populates the #currentPage TOC by scanning for H2s, H3s, etc.
// - Runs 'page_transition' animation if it exists
//
w.addEventListener(
  "load_template",
  async () => {
    console.log("Event:LOAD_TEMPLATE");

    // Load a template on route change or local init
    w.meta.template ||= "article";
    if (meta.template !== document.body.getAttribute("data-template")) {
      let url = `/templates/${meta.template}`;
      try{
        console.log("~~~~~~~~~> INSERT_TEMPLATE"); // :URL:, url);
        document.body.setAttribute("data-template", meta.template);
        document.body.innerHTML = await (await fetch(`${url}.html`)).text();

        // Add Basic Stylesheet ;
        document.body.insertAdjacentHTML(
          "beforeend",
          `<style>${await (await fetch(`${url}.css`)).text()}</style>`
        );

        // Forceload scripts. Moves main.js to footer. 
        Array.from(document.getElementsByTagName("script")).forEach((script) => {
          
          console.log("~~~~~~~~~> REINJECT_TEMPLATE_SCRIPTS"); //":SCRIPT: ", script['src']);
          const newScript = document.createElement("script");
          ["src", "type", "async", "textContent"].forEach(
            (attr) => script[attr] && (newScript[attr] = script[attr])
          );
          document.body.appendChild(newScript);
          script.parentNode.removeChild(script);
        });
      }
      catch(err){ console.log("~~~~~~~~~> INJECT_SCRIPTS:ERROR:", err) }
    }

    // Add Sitemap Stylesheet
    let sm = location.pathname.split("/")[1].replace(".html", "") || "index";
    if (w.sitemap && !w.meta.hide_sitemap) {
      let url = false
      try{
        if (!w.sitemap_content) { 
          url = `${location.origin}/templates/${w.meta.template}_sitemap.css`;
          console.log("~~~~~~~~~> INSERT_SITEMAP_STYLE"); //Stylesheet: ", url);
          let txt = await (await fetch(url)).text();
          document.body.insertAdjacentHTML("beforeend", `<style>${txt}</style>`);
        }
        if (w.sm_name != sm) {
          w.sm_name = sm;
          url = `${location.origin}/posts/${sm_name}_map.json`
          console.log("~~~~~~~~~> GET_SITEMAP_CONTENT"); // :", url);
          w.sitemap_content = await ( await fetch(url) ).json();
        }
      } catch (e) {
        console.log("~~~~~~~~~> INSERT_SITEMAP:ERROR:", url, e)
      }
    }


    document.title = w.meta.title;
    // Delay poptemplte iff refresh not for an anchor link so the page animation can run to it's midpoint.
    const pageT = w.page_transition;
    if (!w.preRendering && location.href.indexOf("#") == -1 && pageT) {
      pageT.style.animation =
        "page_transition 1s alternate 2, gradient 1s alternate 2";
      pageT.addEventListener(
        "animationend",
        async () => (pageT.style.animation = "none"),
        { once: true }
      ); 
      setTimeout(async () => { 
        let resp = await populateTemplate()  
      }, 1100); 
    } else { 
      populateTemplate(); 
    } 
  },
  { passive: true } 
);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const populateTemplate = async () => {
  console.log("~~~~~~~~~~~~> POPULATE_TEMPLATE");

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
    // console.log("id", id, meta[id])
    const el = document.getElementById(id);
    el.innerHTML = "";
    // console.log("~~~~~~~~~~~~> POPULATE_TEMPLATE:", meta[id]);
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
      `event?.preventDefault?.(); navigator.clipboard.writeText('https://charleskarpati.com${
        location.pathname + location.hash
      }'); w.toast?.();`
    );
    header.parentNode.insertBefore(anchor, header.nextSibling);
  });

  // Toggle Template elements visibility
  w.expand &&
    (w.expand.style.display =
      document.getElementsByTagName("aside").length > 0 ? "block" : "none");

  // console.log(w.meta)
  if(w.audio){
    w.audio.style.display = w.meta.audio ? "flex" : "none"
    w.audio.title = w.meta.audio
    // get the nested audio element
    w.audio.querySelector("audio").src = w.meta.audio
  }

  // Restart Observer on new page if included in article_lazy
  loadObserver?.();

  // Ensure unique id's
  document.querySelectorAll("a").forEach((el) => {
    el.id =
      el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000);
  });

  w.updateRedirectListeners?.(); 
  return true
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// IPYNB Requires: {summary, filename} Optionally: {hide_sitemap, toc, tab} in the YAML header.
// Interacted with by: article.html intersection observer
// open when bigger than 900 px. also aligns left of main content.
// toc when bigger then 1100 px aligns right of main content.
// refreshTemplat will toggleSitemap closed if change in sm_name
const createNav = async () => {  
  let currentTab = w.meta.tab||w.meta.filename 
  lbl = (x) => x.tab || x.filename;  

  // Skip or Continue sitemap creation
  const skip = w.meta.hide_sitemap;
  if (w.sitemap) w.sitemap.style.visibility = w.meta.hide_sitemap ? "hidden" : "visible";
  if (!w.sitemap || skip) return;
  
  console.log("~~~~~~~~~~~~~~~> CREATE_NAV: \n\n", {currentTab, sitemap_content:w.sitemap_content} ) 

  // Section Links
  let navLinks = w.sitemap_content.map( (x) => `
  <a id="${lbl(x) == currentTab ? "currentPage" : "link_" + lbl(x)}" 
      id='link_${lbl(x)}' 
      href="${create_url(x.filename, w.sm_name)}.html" 
      title="${lbl(x)}">
      ${shorten(displayLink(lbl(x)), 20)}
  </a>`
  )
  
  // Container
  w.sitemap.innerHTML = `
  <label tabindex="0" for="toggle_sitemap">
      <span>&#x21e8;</span> Sitemap 
      <span>&#x2715;</span>
  </label>
  <hr/>
  <div id='sitemap-content'>
    <a id="link_Home" href="./../index.html" title="Home">Home</a>
    ${navLinks.join("")}
  </div>` 

  document.getElementById('toggle_sitemap').checked=true;
  // Toc Links
  
  // Skip or Continue TOC creation
  if (!("toc" in w.meta) || w.meta.toc.toLowerCase() == "false") return;

  // Create TOC Link
  // tocNode = document.createElement("div");
  // tocNode.setAttribute("id", "toc"); // for Stylesheet
  let tocNode = w["tocHere"] || w["toc"]
  console.log({tocNode})
  tocNode.innerHTML = [...document.querySelectorAll("h2, h3, h4")]
    .map((header) => {
      let x = header.innerText || header.textContent
      const z = formatLink(x);
      const spaces = "&emsp;".repeat(header.tagName.slice(1) - 1);
      return `${spaces}<a href='#${z}' title="${x}">${displayLink(x)}</a>`;
    })
    .join("<br/>");

  // const currentPage = w.sitemap.querySelector(`a[title="${lbl(w.meta)}"]`);
  // currentPage?.parentNode.insertBefore(tocNode, currentPage.nextSibling); 

  console.log('YEEEHAW')
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


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
