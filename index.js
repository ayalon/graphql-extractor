#!/usr/bin/env node

const program = require("commander");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const compress = require("graphql-query-compress");
const uuid = require("uuid/v4");

let sourcePath = "";
let destinationPath = "";

program
  .version("1.0.0", "-v, --version")
  .arguments("<src> <dst>")
  .action((src, dst) => {
    sourcePath = src;
    destinationPath = dst;
  })
  .parse(process.argv);

if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error("no source path given!");
  process.exit(1);
}

if (!fs.existsSync(destinationPath)){
  fs.writeFile(destinationPath, '', function (err) {
    if (err) throw err;
    console.log('Empty file created!');
  });
}


if (!destinationPath || !fs.existsSync(destinationPath)) {
  console.error("no destination path given!");
  process.exit(1);
}

const filePathList = glob.sync("**/*.graphql", {
  cwd: sourcePath,
  absolute: true
});

let queryMap = {};

for (let i = 0; i < filePathList.length; i++) {
  const filePath = filePathList[i];
  const content = fs.readFileSync(filePath, {
    encoding: "utf-8"
  });

  const fileNameHash = hashFnv32a(path.basename(filePath));
  console.log("Extract query from " + filePath);
  const query = compress(content);
  queryMap[query] = fileNameHash;
}

let writePath = destinationPath;
if (fs.lstatSync(writePath).isDirectory()) {
  writePath = path.join(writePath, "output.json");
}

const writeContent = JSON.stringify(queryMap);
fs.writeFileSync(writePath, writeContent);

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
function hashFnv32a(str, asString, seed) {
  /*jshint bitwise:false */
  var i, l,
    hval = (seed === undefined) ? 0x811c9dc5 : seed;

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  if( asString ){
    // Convert to 8 digit hex string
    return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
  }
  return hval >>> 0;
}

