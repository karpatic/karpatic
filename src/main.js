#!/usr/bin/env node
/*
process?.argv?.length>2 && require('./main_cli')( 
  process.argv.slice(2).reduce((acc, curr, i, arr) => 
    (i % 2 === 0 ? acc[curr] = arr[i + 1] || '' : null, acc), {})); // runs deploy({flag:val})

module.exports = {
  importClassName: require("./src/x"),
  notNecessarily: require("./src/y"),
  theSameAsActualClassName: require("./src/z")
};*/