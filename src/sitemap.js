// 5.
//  
const createNav = async () => {   
    // which sitemap to show is located in posts YAML.
    loc = window.meta.sitemap; sm = window.sitemap 
    sm && (sm.style.visibility = loc?'visible':'hidden'); if(!loc)return; 
    let sitemap = await (await fetch(`./posts/${loc}`)).json(); 
    window.lbl = window.lbl || ` 
        <label role="button" tabindex="0" for="toggle-sitemap">
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
const capFirst = (str) => {let l=12; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(':','').slice(0, l) + (str.length > l+1 ? '...' : '') }

function addTocToSiteMap() {
    window.currentPage?.removeAttribute('id')
    let tocNode = document.getElementById('toc'); tocNode && tocNode.remove()
    
    const sitemap = document.getElementById('sitemap')
    const currentPage = sitemap.querySelector(`a[title="${window.meta.summary}"]`)
    currentPage && currentPage.setAttribute('id', 'currentPage')

    if (!('toc' in window.meta) || window.meta.toc != 'true') return;

    // Find all headers and add them to the sitemap directly under the current page's link.
    let toc = [...document.querySelectorAll('h2, h3, h4')]
        .map((header) =>{ 
            const z=capFirst(header.innerText || header.textContent);
            const spaces = '&emsp;'.repeat(header.tagName.slice(1)-1)
            return `${spaces}<a href='#${z}'>${z}</a>`
        })
    .join('<br/>')
    tocNode = document.createElement('div'); tocNode.setAttribute('id', 'toc'); tocNode.innerHTML = toc; 
    currentPage.parentNode.insertBefore(tocNode, currentPage.nextSibling)
}

function addAnchorsToHeaders() {
    [...document.querySelectorAll('h2, h3, h4')].forEach(header => {
        header.id=capFirst(header.innerText||header.textContent);
        let anchor = document.createElement('a'); 
        anchor.className = 'anchor';
        anchor.id = anchor.href = '#'+header.id; 
        anchor.setAttribute('aria-label', 'Link to ' + header.id);
        header.parentNode.insertBefore(anchor, header.nextSibling);
    });
}

//
// Dispatched from handleRoute
// - Used to populate the template with window.meta data
// - Populates 'sitemap' map 
// - - if exists with sitemap.json file and newTemplate (set from handleRoute)
// - - Populates the #currentPage TOC by scanning for H2s, H3s, etc.
// - Else Runs 'pageTransitioneer' animation if it exists
//
window.addEventListener('refreshTemplate', async () => { 
    // console.log('~~~~~~~~~~> refreshTemplate');
    window.meta.robots && ( document.querySelector('meta[name="robots"]')?.setAttribute('content', window.meta.robots) )
    const replace = (id) => {
        const el = document.getElementById(id); el.innerHTML = ''; 
        el.appendChild( document.createRange().createContextualFragment( meta[id] ));
    } 
    const populateTemplate = async () => { 
        ['content', 'title', 'summary'].map((id) => replace( id ) )
        addTocToSiteMap(); addAnchorsToHeaders();

        !window.navEvent && ({ handleRoute: window.handleRoute, navEvent: window.navEvent } = await import(/* webpackChunkName: "router" */ './router.js')); 
    
    }
    const pageT = document.getElementById('pageTransitioneer');
    
    if(window.newSitemap){ await createNav(); }
    if(window.newTemplate){
            populateTemplate(), 
            document.querySelectorAll('a').forEach((el) =>{ el.id = el.id || el.innerText + Math.floor(Math.random() * 100)}) 
    }
    else if ( window.location.href.indexOf('#') == -1 && pageT ){
        pageT.style.animation = 'pageTransitioneer 1s alternate 2, gradient 1s alternate 2'
        setTimeout( ()=>{ !pageT?'':pageT.style.animation = 'none' }, 2300);  
        setTimeout( async ()=>{ populateTemplate(); }, 1100)
    }
}, {passive: true});
