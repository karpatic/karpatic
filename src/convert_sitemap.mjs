import { promises as fs } from 'fs';
import path from 'path';

// clear && node ./src/convert.js ./ipynb/ index,001_Legal,002_Parcels,003_Lore,004_Tutorials,005_Monetize,006_Websites ./src/posts/

//	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ sitemap index,Parcels,Lore,Tutorials,Monetize,Websites

import httpServer from 'http-server';
const server = httpServer.createServer({
    root: './',
    cors: true,
    host: '0.0.0.0'
});

server.listen(8085, () => {
    console.log('Server running at http://localhost:8085');
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function cv_cli_nbs2html() {        
    const args = process.argv.slice(2);
    console.log('cv_cli_nbs2html', args); 
    const pathto = args[0];
    const saveto = args[1];
    const mapname = args[2];
    const pages = args[3].split(',');
    
    const pagePaths = pages.map(page => pathto + page);
    generate_sitemap(pagePaths, saveto, mapname);
}

cv_cli_nbs2html();

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function generate_sitemap(pages, saveto = "../src/posts/", mapname='sitemap') {
    /* 
    0. Publish a set of pages and create a table of contents json file for em.
    Checks or creates sitemap.json and uses it to generate and update pages from the cmd line.
    */
    ///console.log('\n generate_sitemap', pages, saveto, '\n\n');
    let links = [];
    /*
    try {
        const sitemapPath = path.join(saveto, "sitemap.json");
        const sitemapJson = await fs.promises.readFile(sitemapPath, "utf8");
        const sitemapArray = JSON.parse(sitemapJson);
        pages = Array.from(new Set(pages.concat(sitemapArray.map(obj => obj.filename)
            .filter(filename => !pages.some(val => filename.includes(val))))));
    } catch (e) { }
    */

    for (const page of pages) {
        const r = await ipynb_publish(page, saveto);
        if (r.meta.hide === 'false') {
            const { badges, keywords, comments, hide, image, toc, title, ...rest } = r.meta;
            links.push(rest);
        }
    }
    try {
        const sitemapPath = path.join(saveto, mapname+".json");
        await fs.writeFile(sitemapPath, JSON.stringify(links));
    } 
    catch (e) {
        const sitemapPath = path.join(saveto, mapname+".json");
        await fs.writeFile(sitemapPath, "{}"); 
    }
    server.close(() => {
        console.log('Server closed.');
    });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function ipynb_publish(file = 'index', saveto = "../src/posts/", type = 'json') { 
    /*
    1. Publish ipynb to json or html.
    */
   ///console.log(('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
   ///console.log(('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', '\n\n');
   ///console.log(('START:', {saveto, file, type}, '\n');
    let final;
    if (type === 'html') { raw = await nb2html(file); file=/[^/]*$/.exec(file); } 
    else if (type === 'json') {
        const { nb2json } = await import('./convert.mjs?type=module', { type: 'module' } );
        final = await nb2json(file);
        let { filename, ...meta } = final.meta;
        filename = filename.toLowerCase().replace(' ', '_');
        final.meta = { filename, ...meta };
        file = filename
    }
   ///console.log(('Saving ', final, '\n\n');
   ///console.log(('As: ', file, '\n')
   ///console.log(('To ', saveto, '\n\n');
    const t = path.join(saveto, `${file}.${type}`);
    await fs.writeFile(t, type === 'json' ? JSON.stringify(final) : final);
    return final;
}