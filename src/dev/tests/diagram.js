/*
usage: code2flow [-h] [--output OUTPUT] [--language {py,js,rb,php}] [--target-function TARGET_FUNCTION] [--upstream-depth UPSTREAM_DEPTH]
                 [--downstream-depth DOWNSTREAM_DEPTH] [--exclude-functions EXCLUDE_FUNCTIONS] [--exclude-namespaces EXCLUDE_NAMESPACES]
                 [--include-only-functions INCLUDE_ONLY_FUNCTIONS] [--include-only-namespaces INCLUDE_ONLY_NAMESPACES] [--no-grouping] [--no-trimming]
                 [--hide-legend] [--skip-parse-errors] [--source-type {script,module}] [--ruby-version RUBY_VERSION] [--quiet] [--verbose] [--version]
                 sources [sources ...]
*/

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sourceDir = path.join(__dirname, '../../src/ipynb/dataplay/dataplay');
const outputDir = path.join(__dirname, '../../src/client/images/diagrams');

// Ensure the output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Find all Python files in the source directory
fs.readdir(sourceDir, (err, files) => {
  if (err) {
    console.error('Failed to read directory:', err);
    return;
  }

  const pyFiles = files.filter(file => file.endsWith('.py'));

  // Process each Python file individually
  pyFiles.forEach(pyFile => {
    const baseName = path.basename(pyFile, '.py');
    const outputFilePathDot = path.join(outputDir, `dataplay_${baseName}.dot`);
    const outputFilePathPng = path.join(outputDir, `dataplay_${baseName}.png`);
    const command = `code2flow ${path.join(sourceDir, pyFile)} --output ${outputFilePathDot} && dot -Tpng ${outputFilePathDot} -o ${outputFilePathPng}`;


    // skip __init__
    if (baseName == '__init__') { return; }
    console.log(`\n command:`, command, `\n\n`)
    // Execute code2flow on the Python file
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing code2flow for ${pyFile}:`, error);
        return;
      }
      if (stderr) {
        console.error(`Error output from code2flow for ${pyFile}:`, stderr);
        return;
      }
      console.log(`Diagram generated for ${pyFile}: ${outputFilePathPng}`);
    });
  });
});