#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'test-exclude', 'index.js');
const backup = target + '.patchbak';

const patched = `"use strict";

const path = require('path');
const { promisify } = require('util');
// Support both callback-style \`glob\` (older versions) and ESM-style
// \`glob\` packages (v10+/v11+) which export functions differently.
const _rawGlob = require('glob');
let _globFn;
if (typeof _rawGlob === 'function') {
    _globFn = _rawGlob;
} else if (_rawGlob && typeof _rawGlob.glob === 'function') {
    _globFn = _rawGlob.glob;
} else if (_rawGlob && typeof _rawGlob.default === 'function') {
    _globFn = _rawGlob.default;
} else if (_rawGlob && typeof _rawGlob.Glob === 'function') {
    // Wrap class-based API into a callback-style function
    _globFn = function (pattern, opts, cb) {
        if (typeof opts === 'function') {
            cb = opts;
            opts = undefined;
        }
        try {
            const g = new _rawGlob.Glob(pattern, opts || {}, (err, matches) => cb(err, matches));
        } catch (err) {
            cb(err);
        }
    };
} else {
    _globFn = _rawGlob;
}
const glob = promisify(_globFn);

const minimatch = require('minimatch');
const { defaults } = require('@istanbuljs/schema');
const isOutsideDir = require('./is-outside-dir');

class TestExclude {
    constructor(opts = {}) {
        Object.assign(
            this,
            {relativePath: true},
            defaults.testExclude
        );

        for (const [name, value] of Object.entries(opts)) {
            if (value !== undefined) {
                this[name] = value;
            }
        }

        if (typeof this.include === 'string') {
            this.include = [this.include];
        }

        if (typeof this.exclude === 'string') {
            this.exclude = [this.exclude];
        }

        if (typeof this.extension === 'string') {
            this.extension = [this.extension];
        } else if (this.extension.length === 0) {
            this.extension = false;
        }

        if (this.include && this.include.length > 0) {
            this.include = prepGlobPatterns([].concat(this.include));
        } else {
            this.include = false;
        }

        if (
            this.excludeNodeModules &&
            !this.exclude.includes('**/node_modules/**')
        ) {
            this.exclude = this.exclude.concat('**/node_modules/**');
        }

        this.exclude = prepGlobPatterns([].concat(this.exclude));

        this.handleNegation();
    }

    /* handle the special case of negative globs
     * (!**foo/bar); we create a new this.excludeNegated set
     * of rules, which is applied after excludes and we
     * move excluded include rules into this.excludes.
     */
    handleNegation() {
        const noNeg = e => e.charAt(0) !== '!';
        const onlyNeg = e => e.charAt(0) === '!';
        const stripNeg = e => e.slice(1);

        if (Array.isArray(this.include)) {
            const includeNegated = this.include.filter(onlyNeg).map(stripNeg);
            this.exclude.push(...prepGlobPatterns(includeNegated));
            this.include = this.include.filter(noNeg);
        }

        this.excludeNegated = this.exclude.filter(onlyNeg).map(stripNeg);
        this.exclude = this.exclude.filter(noNeg);
        this.excludeNegated = prepGlobPatterns(this.excludeNegated);
    }

    shouldInstrument(filename, relFile) {
        if (
            this.extension &&
            !this.extension.some(ext => filename.endsWith(ext))
        ) {
            return false;
        }

        let pathToCheck = filename;

        if (this.relativePath) {
            relFile = relFile || path.relative(this.cwd, filename);

            // Don't instrument files that are outside of the current working directory.
            if (isOutsideDir(this.cwd, filename)) {
                return false;
            }

            pathToCheck = relFile.replace(/^\.[\\/]/, ''); // remove leading './' or '.\\'.
        }

        const dot = { dot: true };
        const matches = pattern => minimatch(pathToCheck, pattern, dot);
        return (
            (!this.include || this.include.some(matches)) &&
            (!this.exclude.some(matches) || this.excludeNegated.some(matches))
        );
    }

    globSync(cwd = this.cwd) {
        const globPatterns = getExtensionPattern(this.extension || []);
        const globOptions = { cwd, nodir: true, dot: true };
        /* If we don't have any excludeNegated then we can optimize glob by telling
         * it to not iterate into unwanted directory trees (like node_modules). */
        if (this.excludeNegated.length === 0) {
            globOptions.ignore = this.exclude;
        }

        return glob
            .sync(globPatterns, globOptions)
            .filter(file => this.shouldInstrument(path.resolve(cwd, file)));
    }

    async glob(cwd = this.cwd) {
        const globPatterns = getExtensionPattern(this.extension || []);
        const globOptions = { cwd, nodir: true, dot: true };
        /* If we don't have any excludeNegated then we can optimize glob by telling
         * it to not iterate into unwanted directory trees (like node_modules). */
        if (this.excludeNegated.length === 0) {
            globOptions.ignore = this.exclude;
        }

        const list = await glob(globPatterns, globOptions);
        return list.filter(file => this.shouldInstrument(path.resolve(cwd, file)));
    }
}

function prepGlobPatterns(patterns) {
    return patterns.reduce((result, pattern) => {
        // Allow gitignore style of directory exclusion
        if (!/\/\*\*$/.test(pattern)) {
            result = result.concat(pattern.replace(/\/$/, '') + '/**');
        }

        // Any rules of the form **/foo.js, should also match foo.js.
        if (/^\*\*\//.test(pattern)) {
            result = result.concat(pattern.replace(/^\*\//, ''));
        }

        return result.concat(pattern);
    }, []);
}

function getExtensionPattern(extension) {
    switch (extension.length) {
        case 0:
            return '**';
        case 1:
            return `**/*${extension[0]}`;
        default:
            return `**/*{${extension.join()}}`;
    }
}

module.exports = TestExclude;
`;

function apply() {
  try {
    if (!fs.existsSync(target)) {
      console.log('test-exclude not present in node_modules; skipping patch');
      return;
    }
    // make a backup if not exists
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(target, backup);
    }
    fs.writeFileSync(target, patched, 'utf8');
    console.log('Applied test-exclude compatibility patch');
  } catch (err) {
    console.error('Failed to apply test-exclude patch:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

apply();