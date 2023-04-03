// 5.
//  
const createNav = async () => {   
    // which sitemap to show is located in posts YAML.
    loc = window.meta.sitemap; 
    sm = window.sitemap 
    sm && (sm.style.visibility = loc?'visible':'hidden'); 
    if(!loc)return;  
    let sitemap = await (await fetch(`./posts/${loc}`)).json(); 
    // console.log('LOADING5', sitemap);
    window.lbl ||= ` 
        <label tabindex="0" for="toggle_sitemap">
            <div id='drag'>Drag me!</div>
            <span>&#x21e8;</span> Sitemap <span>&#x2715;</span>
        </label>
        <hr/>`
    sitemap = sitemap.map((item) => `
        <a id="${ item.tab==window.meta.tab?'currentPage':('link_'+item.tab)}" 
            id='link_${item.tab }' 
            href="./${item.filename}.html" 
            title="${item.summary}">
            ${item.tab}
        </a>`
    )
    if(sm){ sm.className = loc; sm.innerHTML = `${lbl}<div id='sitemap-content'>${sitemap.join('')}</div>`; }
} 
const formatLink = (str) => str.trim().replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "").slice(0, 12)
    .replace(/\b\w/g, (c) => c.toUpperCase()) + (str.length > 12 + 1 ? "..." : "");

function addTocToSiteMap() {
    window.currentPage?.removeAttribute('id')
    let tocNode = document.getElementById('toc'); tocNode?.remove()
    
    const sitemap = document.getElementById('sitemap')
    const currentPage = sitemap.querySelector(`a[title="${window.meta.summary}"]`)
    currentPage?.setAttribute('id', 'currentPage')

    if (!('toc' in window.meta) || window.meta.toc != 'true') return;

    // Find all headers and add them to the sitemap directly under the current page's link.
    let toc = [...document.querySelectorAll('h2, h3, h4')]
        .map((header) =>{ 
            const z=formatLink(header.innerText || header.textContent);
            const spaces = '&emsp;'.repeat(header.tagName.slice(1)-1)
            return `${spaces}<a href='#${z}'>${z.replaceAll("_", " ")}</a>`
        })
    .join('<br/>')
    tocNode = document.createElement('div'); tocNode.setAttribute('id', 'toc'); tocNode.innerHTML = toc; 
    currentPage.parentNode.insertBefore(tocNode, currentPage.nextSibling)
}

window.toast = () => {
    let e = document.getElementById('toast_container');
    e.style.animation = 'toast 3s';
    e.addEventListener('animationend', () => {e.style.animation ='none';}, { once: true });
}

function addAnchorsToHeaders() {
    [...document.querySelectorAll('h2, h3, h4')].forEach(header => {
        header.id=formatLink(header.innerText||header.textContent);
        let anchor = document.createElement('a'); 
        anchor.className = 'anchor';
        anchor.id = anchor.href = '#'+header.id;  
        anchor.setAttribute('aria-label', 'Link to ' + header.id);
        anchor.setAttribute('onclick', `navigator.clipboard.writeText('https://charleskarpati.com${location.pathname+window.location.hash}'); window.toast?.();`);
        header.parentNode.insertBefore(anchor, header.nextSibling);
    });
}

//
// Dispatched from handleRoute
// - Used to populate the template with window.meta data
// - Populates 'sitemap' map 
// - - if exists with sitemap.json file and newTemplate (set from handleRoute)
// - - Populates the #currentPage TOC by scanning for H2s, H3s, etc.
// - Else Runs 'page_transition' animation if it exists
//
window.addEventListener('refreshTemplate', async () => { 
    // console.log('~~~~~~~~~~> refreshTemplate');
    document.querySelector('meta[name="robots"]')?.setAttribute('content', meta.robots||'index, follow')
    const replace = (id) => {
        if(!meta[id])return;
        const el = document.getElementById(id); el.innerHTML = '';
        el.appendChild( document.createRange().createContextualFragment( meta[id] ));
    } 
    const populateTemplate = async () => { 
        console.log('POPULATING TEMPLATE', !!meta.breadcrumbs);
        meta.breadcrumbs && (meta.breadcrumbs = meta.breadcrumbs.split('/').map((crumb) =>`<a href="./${(crumb=='home'&&' ')||(crumb+'.html')}">${!crumb&&' '||crumb}</a>`).join(' / ') );
        ['content', 'title', 'summary','breadcrumbs'].map((id) => replace( id ) ) 
        addTocToSiteMap(); addAnchorsToHeaders(); 
        !navEvent && ({ handleRoute: window.handleRoute, navEvent: window.navEvent } = await import(/* webpackChunkName: "router" */ './router.js')); 
        updateRedirectListeners(); 
        loadObserver(); 
    } 
    const pageT = document.getElementById('page_transition');
    await createNav();
    if(window.newTemplate){
            populateTemplate(), 
            document.querySelectorAll('a').forEach((el) =>{ el.id = el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000)}) 

    }
    else if ( window.location.href.indexOf('#') == -1 && pageT ){
        pageT.style.animation = 'page_transition 1s alternate 2, gradient 1s alternate 2'
        pageT.addEventListener('animationend', () => {pageT.style.animation ='none';}, { once: true }); 

        setTimeout( async ()=>{ populateTemplate(); }, 1100)
    }
}, {passive: true});
