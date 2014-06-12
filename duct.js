#!/usr/bin/env node

var fs = require("fs-extra")
,   pth = require("path")
,   nopt = require("nopt")
,   uglify = require("uglify-js")
,   cwd = process.cwd()
,   jn = pth.join
,   rfs = function (path) { return fs.readFileSync(path, "utf8"); }
,   wfs = function (path, content) { fs.writeFileSync(path, content, { encoding: "utf8" }); }
,   rjson = function (path) { return JSON.parse(rfs(path)); }
// ,   wjson = function (path, obj) { wfs(path, JSON.stringify(obj, null, 2)); }
,   knownOpts = {
                    "input" :   String
                ,   "output" :  String
                ,   "help":     Boolean
                ,   "version":  Boolean
                }
,   shortHands = {
                    "i":    ["--input"]
                ,   "o":    ["--output"]
                ,   "h":    ["--help"]
                ,   "v":    ["--version"]
                }
,   parsed = nopt(knownOpts, shortHands)
,   options = {
        input:      parsed.input || cwd
    ,   output:     parsed.output
    ,   help:       parsed.help || false
    ,   version:    parsed.version || false
    }
,   err = function (str) {
        console.error("[ERROR] " + str);
        process.exit(1);
    }
,   output = ""
;

if (options.help) {
    console.log([
        "duct [--input /path/to/input/dir] [--output /path/to/generated.js]"
    ,   ""
    ,   "   Build a profile using the duct system."
    ,   ""
    ,   "   --input, -i  <directory> that contains the profile.json and dependencies. Defaults to current."
    ,   "   --output, -o <file> to store the generated profile in. Defaults to $name.js in the input"
    ,   "                directory."
    ,   "   --help, -h to produce this message."
    ,   "   --version, -v to show the version number."
    ,   ""
    ].join("\n"));
    process.exit(0);
}

if (options.version) {
    console.log("duct " + require("./package.json").version);
    process.exit(0);
}

// check some basics
if (!fs.existsSync(options.input)) err("No input directory: " + options.input);
var profilePath = jn(options.input, "profile.json");
if (!fs.existsSync(profilePath)) err("No profile.json in: " + options.input);
var profile = rjson(profilePath);

var resDir = jn(options.input, "node_modules/duct/res");
if (!fs.existsSync(jn(options.input, "node_modules/duct/res"))) resDir = jn(__dirname, "res");

// check name
if (!profile.name) err("Missing name in profile.");
if (!profile.modules) err("Missing modules in profile.");
if (/\.{2,}|\//.test(profile.name)) err("Bad name: " + profile.name);

// default output
if (!options.output) options.output = jn(options.input, name + ".json");

// start with including jquery and promise, because they are always assumed
output += rfs(jn(resDir, "jquery.min.js")) + "\n";
output += rfs(jn(resDir, "promise.js")) + "\n";

// include all the modules
output += "\nfunction () {\n    var modules = {}, resources = {};\n";
for (var k in profile.modules) {
    output += "    modules['" + k + "'] = function (exports) {\n        " +
              rfs(jn(options.input, profile.modules[k])) +
              "\n        return exports;}({});\n";
}

for (var k in (profile.resources || {})) {
    output += "    resources['" + k + "'] = \"" +
              rfs(jn(options.input, profile.resources[k]))
                .replace(/[\\"]/g, "\\$&")
                .replace(/\n/g, "\\n")
                .replace(/\u0000/g, "\\0") +
              "\";\n";
}

// and finally the runner
output += "    " + rfs(jn(resDir, "module-runner.js")) + "\n";
output += "    duct(modules, resources, " + JSON.stringify(profile.configuration || {}) + ");\n";
output += "}();\n";

// uglify
output = uglify.minify(output, { fromString: true }).code;

// write the output
wfs(options.output, output);
