"use strict";(self.webpackChunkkarpatic=self.webpackChunkkarpatic||[]).push([[787],{85:function(e,t,a){a.r(t),a.d(t,{handleRoute:function(){return handleRoute},navEvent:function(){return navEvent}}),window.w=window;const navEvent=async()=>{console.log("~~~~> navEvent");let e=location.href;(-1==e.indexOf("#")?()=>window.scrollTo({top:0,behavior:"smooth"}):()=>w[e.split("#")[1]]?.scrollIntoView({behavior:"smooth"}))(),e.split("#")[0]!=w.href?.split("#")[0]&&(await handleRoute(),w.href=e)},handleRoute=async()=>{if(console.log("~~~~~~> handleRoute:START... "),location.pathname.includes("undefined"))return;w.meta||!isLocal&&registerServiceWorker(),w.toast||await a.e(233).then(a.t.bind(a,412,23));let e="/"==location.pathname?"index":location.pathname.replaceAll("./","").replaceAll("../","").replace(".html","").replace(/^\//,"").replace(/\/$/,""),t=!isLocal||preRendering?`${location.origin}/posts/${e}.json`:`../../ipynb/${e}.ipynb`,o={};try{console.log("~~~~~~> handleRoute:getRouteContent:PATH:",t),o=await(!isLocal||preRendering?await(async()=>(await fetch(t)).json())():(await(async()=>await Promise.all([a.e(212),a.e(156)]).then(a.bind(a,162)))()).nb2json(t))}catch(e){console.log("~~~~~~> handleRoute:getRouteContent:ERROR",t,e),console.log(e)}if(w.oldMeta=w.meta,w.meta=o.meta,meta.content=o.content,w.meta.template||="article",meta.template!==document.body.getAttribute("data-template")){let e=`/templates/${meta.template}`;try{console.log("~~~~~~> handleRoute:templateUrl:URL:",e),document.body.setAttribute("data-template",meta.template),document.body.innerHTML=await(await fetch(`${e}.html`)).text(),document.body.insertAdjacentHTML("beforeend",`<style>${await(await fetch(`${e}.css`)).text()}</style>`),Array.from(document.getElementsByTagName("script")).forEach((e=>{console.log("~~~~~~> handleRoute:templateUrl:injectScripts:SCRIPT: ",e.src);const t=document.createElement("script");["src","type","async","textContent"].forEach((a=>e[a]&&(t[a]=e[a]))),document.body.appendChild(t),e.parentNode.removeChild(e)}))}catch(e){console.log("~~~~~~> handleRoute:templateUrl:ERROR:",e)}}let n=location.pathname.split("/")[1].replace(".html","")||"index";if(w.sitemap&&!w.meta.hide_sitemap){let e=!1;try{if(!w.sitemap_content){e=`${location.origin}/templates/${w.meta.template}_sitemap.css`,console.log("~~~~~~> handleRoute:Sitemap:Stylesheet: ",e);let t=await(await fetch(e)).text();document.body.insertAdjacentHTML("beforeend",`<style>${t}</style>`)}w.sm_name!=n&&(w.sm_name=n,e=`${location.origin}/posts/${sm_name}_map.json`,console.log("~~~~~~> handleRoute:Sitemap:JSON:",e),w.sitemap_content=await(await fetch(e)).json()),document.getElementById("toggle_sitemap").checked=!1}catch(t){console.log("~~~~~~> handleRoute:Sitemap:ERROR:",e,t)}}w.dispatchEvent(new CustomEvent("refreshTemplate"))},registerServiceWorker=async()=>{if("serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/utils/service-worker.js");e.onupdatefound=()=>{const t=e.installing;t.onstatechange=()=>{"installed"==t.state&&(navigator.serviceWorker.controller?console.log("New content is available; Purge occurred. fresh content added to the cache. Refresh."):console.log("Content is cached for offline use."))}}}catch(e){console.error(`Registration failed with ${e}`)}}}}]);