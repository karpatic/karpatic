window.w=window;export const navEvent=async()=>{console.log("~~~~> navEvent");let e=location.href;(-1==e.indexOf("#")?()=>window.scrollTo({top:0,behavior:"smooth"}):()=>w[e.split("#")[1]]?.scrollIntoView({behavior:"smooth"}))(),e.split("#")[0]!=w.href?.split("#")[0]&&(await handleRoute(),w.href=e)};export const handleRoute=async()=>{if(console.log("~~~~~~> handleRoute: START "),location.pathname.includes("undefined"))return;w.meta||!isLocal&&registerServiceWorker(),w.toast||await import("../templates/refresh_template.js");let e="/"==location.pathname?"index":location.pathname.replaceAll("./","").replaceAll("../","").replace(".html","").replace(/^\//,"").replace(/\/$/,"");console.log("~~~~~~> handleRoute: w.meta ","./convert.mjs");let t=await(!isLocal||preRendering?(await fetch(`/posts/${e}.json`)).json():(await(async()=>(console.log("FETCHING"),await import("./convert.mjs")))()).ipynb_publish(`../../ipynb/${e}.ipynb`));if(w.oldMeta=w.meta,w.meta=t.meta,meta.content=t.content,w.meta.template||="article",meta.template!==document.body.getAttribute("data-template")){let e=`/templates/${meta.template}`;console.log("~~~~~~> handleRoute: template ",e),document.body.setAttribute("data-template",meta.template),document.body.innerHTML=await(await fetch(`${e}.html`)).text(),document.body.insertAdjacentHTML("beforeend",`<style>${await(await fetch(`${e}.css`)).text()}</style>`),Array.from(document.getElementsByTagName("script")).forEach((e=>{const t=document.createElement("script");["src","type","async","textContent"].forEach((a=>e[a]&&(t[a]=e[a]))),document.body.appendChild(t),e.parentNode.removeChild(e)}))}let a=location.pathname.split("/")[1].replace(".html","")||"index";if(w.sitemap&&!w.meta.hide_sitemap){if(!w.sitemap_content){let e=`${location.origin}/templates/${w.meta.template}_sitemap.css`;console.log("~~~~~~> handleRoute: Sitemap Stylesheet ",e);let t=await(await fetch(e)).text();document.body.insertAdjacentHTML("beforeend",`<style>${t}</style>`)}if(w.sm_name!=a){w.sm_name=a;let e=`${location.origin}/posts/${sm_name}_map.json`;console.log("~~~~~~> handleRoute: section_map ",e);try{w.sitemap_content=await(await fetch(e)).json()}catch(t){console.log("ERROR FETCHING: ",e,t)}}}w.dispatchEvent(new CustomEvent("refreshTemplate"))};const registerServiceWorker=async()=>{if("serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/utils/service-worker.js");e.onupdatefound=()=>{const t=e.installing;t.onstatechange=()=>{"installed"==t.state&&(navigator.serviceWorker.controller?console.log("New content is available; Purge occurred. fresh content added to the cache. Refresh."):console.log("Content is cached for offline use."))}}}catch(e){console.error(`Registration failed with ${e}`)}};