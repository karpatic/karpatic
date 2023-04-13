// Page Load Logic and Routing
window.oldRoute = location.pathname.replace(origin,'');
window.isLocal ||= !!!window.content?.innerHTML.trim()
window.preRendering = /ReactSnap/.test(navigator.userAgent)

export const navEvent = async (event) => {
    let route = (window.location.href).replace(window.origin,'');  
    if (route.split("#")[0] != window.oldRoute.split("#")[0]){ await handleRoute( route ); window.oldRoute = route; }; 
    route.indexOf('#') == -1 && window.scrollTo({ top: 0, behavior: 'smooth' });
    let t = document.getElementById(route.split('#')[1]); t?.scrollIntoView({ behavior: 'smooth' }); 
};


// Loads a route and it's dependencies via it's meta data obtained from it's path.
// 1) Get meta data from route. 2) Register service worker. 3) load template. 
// 4) Load scripts 5) Dispatch event listeners. 6) Update route change event listeners
export const handleRoute = async (route) => { 
    route=="/" && (route = "index");
    // Get the Upcoming Files Data  // IF IN DEV run the raw convert fn to get the data. 
    route = route.replaceAll('./','').replaceAll('../','').replace('.html','').replace(/^\//, ''); // console.log(route);

    // Client route change for first time.
    !window.meta && !isLocal && registerServiceWorker(); 
    await import(/* webpackChunkName: "sitemap" */ './sitemap.js'); 

    let {ipynb_publish} = isLocal && await import(/* webpackChunkName: "convert" */ './convert.mjs') 

    route = route.endsWith('/') ? (route.slice(0, -1)) : route; 

    
    let url = !preRendering ? `/ipynb/${route}.ipynb` : `/posts/${route}.json`
    // console.log('~~~~~~~~~~~~~~~~ handleRoute: ', url);
    let content = await (!preRendering ? ipynb_publish(url) : (await fetch(url)).json() );

    // Swap YAML old and new; renew the bool.
    window.oldMeta = window.meta; window.meta = content.meta; 
    meta.content = content.content; document.title = window.meta.title; 
    window.newSitemap =  window.oldMeta?.sitemap  !== window.meta.sitemap
    window.newTemplate = window.oldMeta?.template !== window.meta.template 

    // Create a new meta element. Add the meta element to the document's head
    var cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy'; 
    cspMeta.content = window.meta.csp;
    window.meta.csp && document.head.appendChild(cspMeta);

    // Load a template on route change or local init
    if ( newTemplate ){ 
        document.body.innerHTML = await (await fetch(`/templates/${window.meta.template}.html`)).text(); 
        //console.log({newTemplate}, `/templates/${window.meta.template}.html`, document.body.innerHTML);
        
        document.body.insertAdjacentHTML('beforeend',`<style>${ await (await fetch(`${w.location.origin}/templates/${window.meta.template}.css`)).text() }</style>`);

        await loadScripts(); 
    }
    
    // Dispatch pageLoaded event for template/ content hooks 
    // Listeners in template.html and | sitemap.js -> Populates window.newTemplate & updates toc. 
    window.dispatchEvent( new CustomEvent('refreshTemplate') ); 
}

// Re-Load scripts present on page when a new template is added.
// Moves main.js to the footer when prerendering. 
// in dev/ prod this would force a page refresh and is unnecessary.
const loadScripts = async () => {
    //console.log('~~~~~~~~> loadScripts');
    Array.from(document.getElementsByTagName("script")).forEach(script => {
        // console.log( Array.from(script.attributes) )
        // console.log( Array.from(script.attributes).map( a => a.name + '="' + a.value + '"' ).join(' ') )
        // console.log( Array.from(script.attributes) )
        // console.log('---------------------------------- script', script.type, script.src, script.tag, script.type )  
        const newScript = document.createElement("script"); 
        ['src','type','async','textContent'].forEach( attr => { script[attr] && (newScript[attr] = script[attr]) } );
        // script.parentNode.replaceChild(newScript, script);
        document.body.appendChild(newScript);
        script.parentNode.removeChild(script);
    } );
}



const registerServiceWorker = async () => {
    // console.log('~~~~~~~~> registerServiceWorker');
    if (!("serviceWorker" in navigator)) { return }
    try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        /*
        if (registration.installing) { console.log("Service worker installing"); } 
        else if (registration.waiting) { console.log("Service worker installed"); } 
        else if (registration.active) { console.log("Service worker active"); } 
        */
        // Fired when the SW file was modified
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state != 'installed') return 
                if (navigator.serviceWorker.controller) { console.log('New content is available; please refresh.'); } // Purge occurred. fresh content added to the cache. 
                else { console.log('Content is cached for offline use.'); } // Everything has been precached.
            };
        };
    }
    catch (error) { console.error(`Registration failed with ${error}`); }
};