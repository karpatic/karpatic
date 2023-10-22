import { promises as fs } from "fs";
import path from "path";

// clear && node ./src/convert.js ./ipynb/ index,001_Legal,002_Parcels,003_Lore,004_Tutorials,005_Monetize,006_Websites ./src/client/posts/

//	node ./src/convert_sitemap.mjsFROM SAVETO sitemap index,Parcels,Lore,Tutorials,Monetize,Websites
const FROM = './src/ipynb/'
const SAVETO = './src/client/posts'

import httpServer from "http-server";
const server = httpServer.createServer({
  root: "./",
  cors: true,
  host: "0.0.0.0",
});

server.listen(8085, () => {
  // console.log('Server running at http://localhost:8085');
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function cv_cli_nbs2html() {
  const args = process.argv.slice(2);
  const directory = args[0] || "index";

  // ipynb's input and json outputs have matching paths.
  let endPath = args[0] ? args[0] + "/" : "";

  // Search the pathto directory for .ipynb files
  let pages =
    args[1]?.split(",") ||
    (await fs.readdir(`${FROM}${endPath}`))
      .filter((file) => path.extname(file) === ".ipynb")
      .map((file) => path.parse(file).name);

  generate_sitemap(pages, endPath, directory);
}

cv_cli_nbs2html();

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/*
1. Reads from FROM/DIR and saves to SAVETO/DIR
2. An IPYNB of name DIR must exist in FROM/DIR/../
3. sitemap created using 1 & 2 ipynbs only if not meta.hide 
*/

async function generate_sitemap(pages, endPath, directory) {
  console.log('generate_sitemap-',pages, endPath, directory)
  /* 
    0. Publish a set of pages and create a table of contents json file for em.
    Checks or creates sitemap.json and uses it to generate and update pages from the cmd line.
    */
  // console.log('\n generate_sitemap', pages, {directory, endPath}, '\n\n');
  let links = [];

  // Convert the DIR.ipynb first
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

  // Convert each page in DIR/
  let from = `${FROM}/${endPath}`;
  let saveto = `${SAVETO}/${endPath}`;

  // Create saveto directory if it doesn't exist
  try {
    await fs.access(saveto);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        await fs.mkdir(saveto, { recursive: true });
      } catch (mkdirError) {
        console.error("Error creating directory:", mkdirError);
      }
    } else {
      console.error("Error accessing directory:", error);
    }
  }
 
  for (const page of pages) {
    // console.log('~~~~~~~~~~~~~~~~~~', {from:from+page, to});
    const r = await ipynb_publish(from + page, saveto);
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
  console.log('links', links)
  const sitemapPath = path.join(SAVETO, directory + "_map.json"); 
 
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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function ipynb_publish(
  file = "index",
  saveto = SAVETO,
  type = "json"
) {
  console.log('ipynb_publish-',file, saveto, type)
  /*
    1. Publish ipynb to json or html.
    */
  // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', '\n\n');
  let final;
  if (type === "html") {
    raw = await nb2html(file);
    file = /[^/]*$/.exec(file);
  } else if (type === "json") {
    const { nb2json } = await import("./convert.mjs?type=module", {
      type: "module",
    });
    final = await nb2json(file);
    // console.log('START:', {saveto, file, type}, Object.keys(final.meta))
    let { filename, ...meta } = final.meta;
    //console.log(final)
    try {
      filename = filename?.toLowerCase().replaceAll(" ", "_");
    } catch (e) {
      console.log("ERROR: ", e); // Typically undefined
      filename = file.split("/")[file.split("/").length - 1];
    }
    final.meta = { filename, ...meta };
    file = filename;
  }
  ///console.log(('Saving ', final, '\n\n');
  ///console.log(('As: ', file, '\n')
  ///console.log(('To ', saveto, '\n\n');
  const t = path.join(saveto, `${file}.${type}`);
  await fs.writeFile(t, type === "json" ? JSON.stringify(final) : final);
  return final;
}

// Reads a JSON file named "sitemap.json" from a directory,
// then merges the unique filenames from the sitemap into the existing pages array
/*
try {
    const sitemapPath = path.join(saveto, "sitemap.json");
    const sitemapJson = await fs.promises.readFile(sitemapPath, "utf8");
    const sitemapArray = JSON.parse(sitemapJson);
    pages = Array.from(new Set(pages.concat(sitemapArray.map(obj => obj.filename)
        .filter(filename => !pages.some(val => filename.includes(val))))));
} catch (e) { }
*/
