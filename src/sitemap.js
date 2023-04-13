// 5.
//  
// IPYNB Requires: {summary, filename, hide_sitemap} Optionally: {tab} in the YAML header.
const createNav = async () => {   
    // which sitemap to show is located in posts YAML.
    const show = !!!window.meta.hide_sitemap;
    const sm_name = location.pathname.split('/')[1].replace('.html','')||'index';
    const sm_el = window.sitemap; 
    sm_el.style.visibility = show?'visible':'hidden';
    if(show && sm_el){
        // console.log(document.querySelector(`style sitemap`));
        if(!document.querySelector(`style sitemap`)){
            let txt  = await (await fetch(`${w.location.origin}/templates/${window.meta.template}_sitemap.css`)).text() 
            document.body.insertAdjacentHTML('beforeend', `<style>${ txt }</style>`);
        }
    }
    if(!show)return; 
    
    window.lbl ||= ` 
        <label tabindex="0" for="toggle_sitemap">
            <div id='drag'>Drag me!</div>
            <span>&#x21e8;</span> Sitemap <span>&#x2715;</span>
        </label>
        <hr/>`
    let create_url = (x) =>{
        let pageIsRoot = window.meta.filename == sm_name
        let linkIsRoot = x.filename == sm_name
        let path = linkIsRoot ? `.${pageIsRoot ? '/' + sm_name : '/../' + sm_name}` : `./${pageIsRoot ? sm_name + '/' + x.filename : x.filename}`;
        return path+'.html';
    }
    tab = (x) => x.tab || x.filename
    let url = `/posts/${sm_name}_map.json`
    // console.log('createNav: ', url)
    let content = (await (await fetch(url)).json()).map((x) => `
        <a id="${ tab(x)==window.meta.tab?'currentPage':('link_'+tab(x))}" 
            id='link_${tab(x) }' 
            href="${create_url(x)}" 
            title="${x.summary}">
            ${shorten(capitalize(tab(x).replaceAll("_", " ")),20)}
        </a>`
    ).join('')
    if(sm_el){ sm_el.className = sm_name; sm_el.innerHTML = `${lbl}<div id='sitemap-content'>${content}</div>`; }
} 

const capitalize = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase()) 
const formatLink = (str) => shorten(capitalize(str.trim().replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "") ))
const shorten = (str, len=12) => str.slice(0, len) + (str.length > len + 1 ? "..." : "");

function addTocToSiteMap() {
    window.currentPage?.removeAttribute('id')
    let tocNode = document.getElementById('toc'); tocNode?.remove()
    
    const sitemap = document.getElementById('sitemap')
    const currentPage = sitemap.querySelector(`a[title="${window.meta.summary}"]`)
    currentPage?.setAttribute('id', 'currentPage')

    console.log(window.meta, !('toc' in window.meta), window.meta.toc.toLowerCase() == 'false', !('toc' in window.meta) || window.meta.toc.toLowerCase() == 'false');
    if (!('toc' in window.meta) || window.meta.toc.toLowerCase() == 'false') return;
    console.log('success')

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
// - - if exists with sitemap file and newTemplate (set from handleRoute)
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
        //console.log('POPULATING TEMPLATE');
        // console.log({meta, location:window.location})
        let file = window.meta.filename 
        let crumbs = 'home'; file != 'index' && (crumbs+=window.location.pathname.replace('.html','') )
        window.meta.breadcrumbs = crumbs.split('/').map((crumb, i) =>{
            let curDepth = window.location.pathname.split('/').length
            let atDepth = curDepth-1-i;  
            let base = Array(atDepth).fill('..').join('/'); base && (base += '/'); base= './'+base;
            // console.log({curDepth, i, 'atDepth':atDepth, crumb, base});
            let t = `<a href="${base}${crumb=="home"?'index':crumb}.html">${capitalize(crumb.replaceAll("_", " "))}</a>`
            // console.log({t})
            return t; 
        }).join(' / ');
        // console.log(window.meta.breadcrumbs, window.breadcrumbs);
        ['content', 'title', 'summary','breadcrumbs'].map((id) => replace( id ) ) 
        addTocToSiteMap(); addAnchorsToHeaders(); 
        if(window.expand) window.expand.style.display = document.getElementsByTagName('aside').length > 0 ? 'block' : 'none';
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
