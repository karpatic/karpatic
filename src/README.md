# Welcome!

## About

I keep my client-side code here. There are three environments: [dev, build, prod]. 

> keywords: Static-site-generation (SSG), Template-engine, Single-Page-Application (SPA), Client-Side Navigation, Rehydration, Prerender

## OVERVIEW

```
KARPATIC
|- README 
|- package.json
|- webpack.config.js
|- Makefile  
|- src
|  |- README: (you are here)
|  - index.js, 
|  |- utils 
|  |  |- refresh_template.js
|  |  |- route.js
|  |  |- service-worker.js 
|  |- ipynb: page content
|- rsc
|  |- audio
|  |- cdn
|  |- images
|  |- templates
|  |- posts
|  |  |- assets
|  |  |- [blog,labs,...].json 
|- ipynb
|  |- [blog,labs,...].pynb
|- docs
|  |- [blog,labs,...].html 
|- .env
|- sitemap.txt
|- robots.txt
|- CNAME  
```
 
## How the SPA Works:

Webpack uses both the HEAD and a BODY tag as entry points.
|- HEAD - Used during dev/Prerender. Grabs the IPYNB JSON to stuff meta data into the header and then triggers template lazyload
|- BODY
|  |- index.js - Inlined as specified w webpack along with index.css which it imports. Creates Popstate/event lazy load of router/template.
|  |- route.js 
|  |- refresh_template.js - Injects Template HTML, CSS, and JS. Warning: JS operations get captured in Prerender if it effects the elements or their attributes (transition effects).

route.navEvent: 
- Handles clicks on relative links, 
- calls handleRoute for different pages or scrolls to anchor on same page, 
- opens parent <details> elements, 
- preserves `/docs/` in the visible/history URL when present, while normalizing it away for route comparison

route.handleRoute: 
- Registers service worker, 
- updates window.meta from path using nb2json (local) / JSON fetch (prod) / CMS fallback, 
- imports refresh_template.js, 
- dispatches refresh event

refresh_template REQUIREMENTS: 
- w.meta{title, summary, filename, content, template} -> #title, #summary, #content 
- w.meta.{
  tab, - page title/ displayname
  hide_sitemap: #toggle_sitemap, #sitemap, 
  #page_transition, 
  hide_toc: #toc or #tocHere, 
  hide_breadcrumbs: #breadcrumbs, 
  hide_transition: #page_transition,  
  audio: w.audio
}     
// - #toast_container, window.toast, 
// - w.expand - expand/collapse button for aside elements 


## DEV: Pre-Compile

- `make pages;` - included in the build command, each .ipynb in the /ipynb directory specified in the makefile command becomes a template-ready [/rsc/posts/{dir}{file}.json] file.

## Public Webdev Notes and ipynb2web

- The public `Webdev_*` notes live in `/home/carlos/Documents/GitHub/www/notes/notes/`.
- The CMS-facing copies live in `/home/carlos/Documents/GitHub/www/notes/` and are the copies this site currently reads for online note text.
- The local converter source is `/home/carlos/Documents/GitHub/packages/ipynb2web`; docs live at `https://ipynb2web.com/`.
- Browser API docs: `https://ipynb2web.com/jsdocs/module-Ipynb2web_browser.html`.
- The browser build exposes only async `ipynb2web.nb2json(pathOrUrl)`. Script-tag usage attaches `window.ipynb2web`; ESM usage imports the default browser module.
- Bundless.dev (`/home/carlos/Documents/GitHub/packages/bundless`, `https://Bundless.dev`) is available when notebook/page work needs browser-side React/JSX/TSX without a build step.
- `/home/carlos/Documents/GitHub/packages/vanillapivottable` is available for browser pivot-table/data visualization pages.

## DEV: Webpack

`npm run start/ build` will start the dev/build  server.

- Local webpack dev serves the app from `/`, not from `/docs/`.
- The dev server rewrites incoming `/docs/...` requests back to root so prod-shaped URLs can still be tested locally.
- Because of that rewrite, `/docs/` is a local alias for route testing, not the actual local mount point.

Webpack compiles the client as so:

    <head>
      <meta charset="UTF-8">
      <title>My Webpack App</title>
      <script> Index.js Inlined </script>
      <script src="head.js"> Injected</script>
    </head>

- Debugging: Toggle `purefuncs` for console log

## Client-Side Outline:

- Index.js renders (dev/ r-snap/ prod).
- - Attaches router evt listener to lazy-load [router.js]

- Header.js renders (r-snap/ dev) and then remove itself for (prod).
- - Uses: [header.json,posts/{dir}{file}.json]
- - `Head.json`: uses rsc/images/ for meta tags
- - Dispatches router

- Router.js
- - Updates updates window.meta
- - Dispatches 'refreshTemplate' which triggers [refresh] 

- Refresh_template.js
- - injects template content and conditionally refreshes sitemap/TOC

## Usage Instructions 

- Router.js 
- - Dispatches 'refreshTemplate' which triggers [refresh] 

- w.addEventListener( "refresh", () => {} )
- - document.title
- - w[meta][template] ||= "article"
- - getAttribute("data-template")
- - - Inject HTML + CSS + JS
- - Get SiteMap()
- - w[sitemap] && !w[meta][hide_sitemap]
- - - w[sm_name] 
- - - w[sitemap_content] 
- - - Inject CSS + text from filtered /notes/notes.json
- - - Public notes dependency: sitemap data comes from the publicly readable `/notes/notes.json` corpus
- - populateTemplate()

- The notes.json filename attr is filtered for `<subject>_` and its rm from the title for showing in the url.
- Route fallback for note-like pages uses `https://getfrom.net/notes/<route-with-slashes-replaced-by-underscores>`.
- Public-note reading is intentionally unauthenticated; admin password belongs to my www/notes edit flows, not these reads.
- Top-level authored links should stay sibling-relative (for example `./webdev.html`, not `./docs/webdev.html`) so the same content works both at local-dev root and under deployed `/docs/` URLs.

- populateTemplate()
- - w[page_transition]`
- - Updates w[content,title,summary,breadcrumbs]
- - createNav()
- - Add Anchor Tags => w.toast()
- - Reset Dark Mode/ Audio/ Expanded Icons
- - loadObserver?.();

- createNav()
- - getToc() == w[meta][toc] || querySelectorAll(h2, h3, h4)
- - w[tocHere] || w[toc]
- - w[meta][hide_sitemap]
- - w[sitemap].innerHTML
- - - w[toggle_sitemap].checked = true;
- - - w[toggle_toc]
- - - x[tab] || x[filename] 

- hide_sitemap: false
- hide_toc: true
- hide_breadcrumbs: true
- hide_transition: true
- prettify: true
- tab: displayLabel
- keywords: ['data'] 


## Build Steps

0. Make: Create sitemap and convert ipynb's
1. Webpack: Copy static assets to build dir
2. Webpack: Run build. Custom plugin handles readme/homepage. Generates:

  ```
    <!doctype html>
    <html lang="en" dir="ltr">
      <head id="head">
        <script defer="defer" src="/build/index.57.d0c85dcd9ca8322fa618.js"></script>
        <script defer="defer" src="/build/head.296.d0c85dcd9ca8322fa618.js"></script>
        <script defer="defer" src="/build/head.577.d0c85dcd9ca8322fa618.js"></script>
        <style> css imported by index.js</style>
        undefined
      </head>undefined
      <body></body>
      undefined
    </html>
  ```

3. Prerender: 

HEAD removes its script tag after injecting the head content and calling the router logic.

INDEX.JS script and CSS gets inlined as refresh_template content.

## Build: Prerender

Pre-render the pages locally during the build step and rehydration and navigation logic get lazy loaded.

1. visits `/` or any other pages listed in `include` configuration.
2. find all links on the page with the same domain, add them to queue
3. If there is more than one page in the queue it also adds `/404.html` to the queue
4. renders the page with the help of puppeteer using options.spa to load the route.
5. waits till there are no active network requests for more than 0.5 second

Current docs-path hosting notes:
- Built/prerendered client-visible routes should stay under `/docs/...`.
- Router/content resolution strips `/docs/` only when translating the browser pathname into `rsc/posts/...` or CMS note paths.
- Prerender defaults crawl from `/docs/index.html` and treat `/docs/*.html` or extensionless `/docs/*` requests as SPA routes, then write the captured output back into `docs/` without creating `docs/docs/`.
- Local webpack dev still mounts at `/`; `/docs/...` only works there because `devServer.setupMiddlewares` rewrites it to the root route before static serving/history fallback.

## Misc

The following are being used internally.

- `Robots.txt` -> specify sitemaps and nofollow noindex section/links. More [info](https://search.google.com/search-console/welcome), [here](https://support.google.com/webmasters/answer/7451001). 


# IPYNB MD Notes

Each notebook should start with a yaml cell. Processing instructions can be modified on a per-cell basis.

## Yaml

Typically looks like:

```
# Page Header
> A brief description of what this page has to offer.

- key: value
- anotherKey: anotherVvalue
```

Possible Key's: Sample Values

- `keywords`: ['seo_term', 'another_term]
- `meta.prettify: true`
- `hide: true`
- content, template, hide_sitemap, title, breadcrumbs, audio, summary, filename, tab, toc, hide

## Cell Flags

- `%%javascript`: will rm the input and display output if not error
- `#input_show`: equivilant to %%javascript but saves input
- `%%capture`
- `hide `


## Text Decorators

```
^[footnote content]
^[Some warning message{.info}
^[Some tip message]{.tip}
^[Some info message]{.warning}
```

## Misc

%%capture will not show input source
- Prefix a ipynb file with `_` to have it be excluded from the sitemap and processing.  



### Prettier

- I use Prettier in Visual Studio Code. More [information](https://dev.to/gulshansaini/how-to-disable-prettier-in-vscode-for-a-specific-project-2a48).