import { promises as fs } from 'fs';
import path from 'path';

const targetDir = 'src/client/posts';
const sitemapFile = './sitemap.txt';
let pages = [];

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

(async () => {
    await processDirectory(targetDir);
    try {
        await fs.writeFile(sitemapFile, pages.join('\n') + '\n');
        console.log('Sitemap file created successfully:', sitemapFile);
    } catch (err) {
        console.error(`Error creating or truncating sitemap file: ${sitemapFile}`, err);
    }
})();
