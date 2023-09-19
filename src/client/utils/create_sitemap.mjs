import { promises as fs } from 'fs';
import path from 'path';

const ipynbDir = 'src/ipynb';
const sitemapFile = './sitemap.txt';
let pages = [];

async function processDirectory(directory, subdir = '') {
    const stat = await fs.stat(directory);
    if (!stat.isDirectory()) { 
        console.log('\n\n UNABLE TO PROCESS DIRECTORY: ', directory, subdir )
        return;
    }
    // generate url for ipynb file in directory
    const files = await fs.readdir(directory);
    files.filter(file => path.extname(file) === '.ipynb').map(file => { 
        pages.push(`https://www.cvminigames.com/${subdir ? subdir + '/' : ''}${path.parse(file).name}.html` ); 
    });
    // recursively processes subdirectories except where filename == notready
    await Promise.all( files.filter(file => !path.extname(file) && path.parse(file).name != 'notready').map(file => { 
        processDirectory(path.join(directory, path.parse(file).name), path.join(subdir, path.parse(file).name))
    }) );
}

(async () => {
    await processDirectory(ipynbDir);
    try { await fs.writeFile(sitemapFile, pages.join('\n') + '\n');
        console.log('Sitemap file created successfully:', sitemapFile);
    } catch (err) {
        console.error(`Error creating or truncating sitemap file: ${sitemapFile}`, err);
    }
})();
