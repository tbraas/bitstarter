#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(html) {
    return cheerio.load(html);
};

var loadHtmlDocumentFromFile = function(htmlFile) {
    return fs.readFileSync(htmlFile);
};

var loadHtmlDocumentFromUrl = function(url, checksfile) {
    var retval = null;
    rest.get(url).on('complete', function(result, response) {
        if (result instanceof Error) {
            process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
        }
        checkAndPrintToConsole(result, checksfile);
    });
    return retval;
};

var checkAndPrintToConsole = function(htmlDocument, checksfile) {
    var checkJson = checkHtml(htmlDocument, checksfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(htmlDocument, checksfile) {
    $ = cheerioHtmlFile(htmlDocument);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var validateHtmlDocumentFromUrl = function(url, checksfile) {
    loadHtmlDocumentFromUrl(url, checksfile, checkHtml);
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <url>', 'URL')
        .parse(process.argv);
    var fileContent = null;
    if (program.file) {
        fileContent = loadHtmlDocumentFromFile(program.file);
        checkAndPrintToConsole(fileContent, program.checks);
    }
    else if (program.url) {
        validateHtmlDocumentFromUrl(program.url, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
