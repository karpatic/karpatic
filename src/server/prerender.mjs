import { promises as fs } from 'fs';
import path from 'path';
import httpServer from "http-server";

// Check the third argument from the command line
const args = process.argv.slice(2);
const directory = args[0] || '';
const FROM = './src/ipynb/' // Grab all json
const SAVETO = './src/client/posts/' // Convert FROM, SAVETO here, then create sitemapFile with it. 
const sitemapFile = './sitemap.txt';  // Save to sitemap.txt

// console.log(':'+args+':'+directory+':')

// createSitemap.txt - Grab filenames from generate_sectionmap Json and saves them to sitemap.txt
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let pages = [];

async function createSitemap(){
    console.log( `\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ START createSitemap \n\n`)
    await processDirectory(SAVETO);
    try {
        await fs.writeFile(sitemapFile, pages.join('\n') + '\n');
        console.log('Sitemap file created successfully:', sitemapFile);
    } catch (err) {
        console.error(`Error creating or truncating sitemap file: ${sitemapFile}`, err);
    }
}

async function processDirectory(directory, subdir = '') {
    const stat = await fs.stat(directory);
    if (!stat.isDirectory()) { 
        console.log('\n\n UNABLE TO PROCESS DIRECTORY: ', directory, subdir);
        return;
    }

    const files = await fs.readdir(directory);
    await Promise.all(files.filter(file => file.includes('_map.json')).map(async file => {
        const filePath = path.join(directory, file);
        const jsonData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

        jsonData.forEach(obj => {
            if (obj.filename) {
                pages.push(`http://www.charleskarpati.com/${file.split('_')[0].split('.')[0]}/${subdir ? subdir + '/' : ''}${obj.filename}`);
            }
        });
    }));

    // recursively process subdirectories
    await Promise.all(files.filter(file => !path.extname(file)).map(file => {
        return processDirectory(path.join(directory, file), path.join(subdir, file));
    }));
}

// generate_sectionmap - ipynb_publish all files in directory and also creates section_map.json
/*
1. Reads from FROM/DIR and saves to SAVETO/DIR
2. An IPYNB of name DIR must exist in FROM/DIR/../
3. sitemap created using 1 & 2 ipynbs only if not meta.hide 
*/
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function cli_nbs2html() {            
  // Search the pathto directory for .ipynb files
  console.log( `\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ cli_nbs2html: start: ${FROM}${directory}/`) 
  let pages =
      args[1]?.split(",") ||
      (await fs.readdir(`${FROM}${directory}/`))
          .filter((file) => path.extname(file) === ".ipynb")
          .map((file) => path.parse(file).name); // filename without extension
  generate_sectionmap(pages, directory); 
}

async function generate_sectionmap(pages, directory) {
    console.log(`\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ cli_nbs2html: generate_sectionmap: `,pages, directory)
    const server = httpServer.createServer({
        root: "./",
        cors: true,
        host: "0.0.0.0",
    });

    server.listen(8085, () => {
        // console.log('Server running at http://localhost:8085');
    });
    /* 
      0. Publish a set of pages and create a table of contents json file for em.
      Checks or creates sitemap.json and uses it to generate and update pages from the cmd line.
      */
    // console.log('\n generate_sectionmap', pages, {directory, endPath}, '\n\n');
    let links = [];
  
    // Convert the DIR.ipynb file if it's not the root directory.
    if(directory){
      let {
        csp,
        sitemap,
        breadcrumbs,
        badges,
        keywords,
        comments,
        hide,
        image,
        toc,
        title,
        ...rest
      } = (await ipynb_publish(`${FROM}${directory}`, SAVETO))
        .meta; 
      // await csp && console.log("COMPLETE")
      links.push(rest);
    }
  
    // Convert each page in DIR/
    // Create saveto directory if it doesn't exist
    try {
      await fs.access(`${SAVETO}${directory}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        try {
          await fs.mkdir(`${SAVETO}${directory}`, { recursive: true });
        } catch (mkdirError) {
          console.error("Error creating directory:", mkdirError);
        }
      } else {
        console.error("Error accessing directory:", error);
      }
    }
   
    for (const page of pages) {
      const r = await ipynb_publish(`${FROM}${directory}/${page}`, `${SAVETO}${directory}`);
      if (!!!r.meta.hide) {
        const {
          csp,
          sitemap,
          breadcrumbs,
          badges,
          keywords,
          comments,
          hide,
          image,
          toc,
          title,
          ...rest
        } = r.meta;
        links.push(rest);
      }
    } 
    // console.log('links', links)
    const sitemapPath = `${SAVETO}${directory||'index'}_map.json`; 
   
    try {
      
      //console.log('sitemapPath', sitemapPath, links)
      await fs.writeFile(sitemapPath, JSON.stringify(links));
    } catch (e) {
      await fs.writeFile(sitemapPath, "{}");
      console.log(
        "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~----ERROR:",
        r.meta
      );
    }
    server.close(() => { console.log("Server closed."); }); 
}

async function ipynb_publish(
    filePath, // path/to/file wihout the .ipynb extension
    saveDir, //path/to/directory
    type = "json"
  ) {
    // console.log('ipynb_publish-',filePath, saveDir, type)
    /*
      1. Publish ipynb to json or html.
      */
    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', '\n\n');
    let final;
    if (type === "json") {
      const { nb2json } = await import("./../client/utils/convert.mjs?type=module", {
        type: "module",
      }); 
      final = await nb2json(filePath); 
    }
    let pyCode = final.meta.pyCode;
    if(pyCode?.length){
      // save into folder by name of filePath+'.py'
      let pathTo = `${FROM}${directory}/`;
      let file = filePath.replace(pathTo, '') 
      file = file.replace(/^\d{2}_/, ''); // rm path and XX_ prefix
      file = final.meta.default_exp || file 
      let pyCodeFilePath = `${FROM}${directory}/${directory}/${file}.py`
      let txt = pyCode.join('\n').replace(/(^|\n) /g, '$1')
      
      // console.log('pyCode',txt)
      await fs.writeFile(pyCodeFilePath, txt);
    }
    delete final.meta.pyCode;
    ///console.log(('Saving ', final, '\n\n');
    ///console.log(('As: ', file, '\n')
    ///console.log(('To ', saveDir, '\n\n'); 
    const t = path.join(saveDir, `${final.meta.filename}.${type}`);
    await fs.writeFile(t, type === "json" ? JSON.stringify(final) : final);
    return final;
}
async function createAudio() {
  // imprt create_audio
  const { speechFromDir } = await import('./../server/create_audio.mjs');
  speechFromDir('./src/client/posts/','./src/client/audio/');
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

if (directory === 'sitemap') { createSitemap(); }
else if(directory === 'audio') { createAudio(); }
else{ cli_nbs2html();}