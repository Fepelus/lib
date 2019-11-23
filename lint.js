/*
Copyright (C) 2019 Patrick Borgeest

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA
OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
*/

import jslint from "./jslint.js";
import fs from "fs";
import path from "path";
import process from "process";
import {compose, prop, runProp, tap} from "./academie.js";

const lint = (function linterFactory() {
    const config = {
        es6: true,
        node: true
    };
    // const mocha = ["mocha", "test", "suite", "setup", "teardown"];
    // const webworker = ["postMessage", "onmessage"];
    const globals = [];
    const fmt = function (warn) {
        return `    - (${warn.line + 1}:${warn.column + 1}) ${warn.message}`;
    };

    return function lint(filename) {
        const source = fs.readFileSync(filename, {encoding: "UTF8"});
        const result = jslint(source, config, globals);

        const msgs = result.warnings.map(fmt).join("\n");

        return {
            pass: result.warnings.length === 0,
            filename,
            msgs
        };
    };
}());

function walk(directory, filepaths = []) {
    if (directory.endsWith(".js")) {
        return directory;
    }
    const files = fs.readdirSync(directory);
    files.forEach(function (filename) {
        const filepath = path.join(directory, filename);
        if (fs.statSync(filepath).isDirectory()) {
            return walk(filepath, filepaths);
        }
        if (path.extname(filename) === ".js") {
            return filepaths.push(filepath);
        }
    });
    return filepaths;
}

function countFailures(results) {
    const neg = (bool) => !bool;
    const failed = compose(neg, prop("pass"));
    return compose(
        prop("length"),
        runProp("filter", failed)
    )(results);
}

function printTap(results) {
    const wrap = (content) => "  ---\n" + content + "\n  ...";
    const index = (function () {
        let idx = 0;
        return function () {
            idx += 1;
            return idx;
        };
    }());
    const fmt = (result) => (
        result.pass
        ? `ok ${index()} ${result.filename}`
        : `not ok ${index()} ${result.filename}` + "\n" + wrap(result.msgs)
    );
    console.log("TAP version 13");
    console.log("1.." + results.length);
    results.forEach(compose(console.log, fmt));
}

function lintdirs(dirs) {
    const walkdir = (directory) => walk(directory);
    return dirs.flatMap(walkdir).map(lint);
}

const slice = (n) => (arr) => arr.slice(n);
const getDirnamesFromCommandLine = slice(2);

function main(argv) {
    return compose(
        countFailures,
        tap(printTap),
        lintdirs,
        getDirnamesFromCommandLine
    )(argv);
}

// exit code is count of failed files which gives us 0 for success
process.exit(main(process.argv));
