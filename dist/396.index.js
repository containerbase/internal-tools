"use strict";
exports.id = 396;
exports.ids = [396];
exports.modules = {

/***/ 45396:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "run": () => (/* binding */ run)
});

// EXTERNAL MODULE: ./util.ts
var util = __webpack_require__(92536);
// EXTERNAL MODULE: ./utils/builds.ts + 4 modules
var builds = __webpack_require__(26007);
// EXTERNAL MODULE: ./utils/config.ts
var utils_config = __webpack_require__(84600);
// EXTERNAL MODULE: external "node:timers/promises"
var promises_ = __webpack_require__(99397);
// EXTERNAL MODULE: ./utils/docker/common.ts
var common = __webpack_require__(26841);
// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(39201);
// EXTERNAL MODULE: ./utils/types.ts
var types = __webpack_require__(5689);
// EXTERNAL MODULE: ../.yarn/cache/@sindresorhus-is-npm-4.6.0-7cad05c55e-83839f13da.zip/node_modules/@sindresorhus/is/dist/index.js
var dist = __webpack_require__(34409);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
// EXTERNAL MODULE: ../.yarn/cache/chalk-npm-4.1.2-ba8b67ab80-fe75c9d5c7.zip/node_modules/chalk/source/index.js
var source = __webpack_require__(88663);
;// CONCATENATED MODULE: ./utils/docker.ts






const errors = [
    'unexpected status: 400 Bad Request',
    ': no response',
    'error writing layer blob',
];
function canRetry(err) {
    return errors.some((str) => err.stderr.includes(str));
}
async function build({ image, imagePrefix, imagePrefixes, cache, cacheFromTags, cacheToTags, tag = 'latest', tags, dryRun, buildArgs, platforms, push, }) {
    const args = ['build'];
    if (dist_default().nonEmptyArray(buildArgs)) {
        args.push(...buildArgs.map((b) => `--build-arg=${b}`));
    }
    if (platforms?.length) {
        args.push(`--platform=${platforms.join(',')}`);
    }
    for (const prefix of [imagePrefix, ...(imagePrefixes ?? [])]) {
        args.push(`--tag=${prefix}/${image}:${tag}`);
        if (tags?.length) {
            args.push(...tags.map((tag) => `--tag=${prefix}/${image}:${tag}`));
        }
    }
    if (dist_default().string(cache)) {
        const cachePrefix = cache.split('/')[0]?.match(/[.:]/)
            ? ''
            : `${imagePrefix}/`;
        const cacheImage = `${cachePrefix}${cache}:${image.replace(/\//g, '-')}`;
        args.push(`--cache-from=${cacheImage}-${tag}`);
        if (dist_default().nonEmptyArray(cacheFromTags)) {
            for (const ctag of cacheFromTags) {
                args.push(`--cache-from=${cacheImage}-${ctag}`);
            }
        }
        if (!dryRun && push) {
            args.push(`--cache-to=type=registry,ref=${cacheImage}-${tag},mode=max,ignore-error=true`);
            if (dist_default().nonEmptyArray(cacheToTags)) {
                for (const ctag of cacheToTags) {
                    args.push(`--cache-to=type=registry,ref=${cacheImage}-${ctag},mode=max,ignore-error=true`);
                }
            }
        }
    }
    if (dryRun) {
        logger/* default.warn */.Z.warn(source.yellow('[DRY_RUN]'), source.blue('Would push'));
    }
    else if (push) {
        args.push('--push', '--provenance=false');
    }
    for (let build = 0;; build++) {
        try {
            await (0,common/* dockerBuildx */.WR)(...args, '.');
            break;
        }
        catch (e) {
            if (e instanceof types/* ExecError */.X && canRetry(e) && build < 2) {
                logger/* default.error */.Z.error(source.red(`docker build error on try ${build}`), e);
                await (0,promises_.setTimeout)(5000);
                continue;
            }
            throw e;
        }
    }
}

// EXTERNAL MODULE: ./utils/docker/buildx.ts
var buildx = __webpack_require__(25258);
;// CONCATENATED MODULE: ./utils/docker/cosign.ts

async function cosign(...args) {
    return await (0,util/* exec */.GL)('cosign', [...args]);
}

// EXTERNAL MODULE: ../.yarn/cache/@actions-core-npm-1.10.1-3cb1000b4d-96524c2725.zip/node_modules/@actions/core/lib/core.js
var core = __webpack_require__(80002);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/datasource/common.js
var datasource_common = __webpack_require__(43678);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/versioning/index.js
var modules_versioning = __webpack_require__(49415);
;// CONCATENATED MODULE: ./commands/docker/builder.ts













function createTag(tagSuffix, version) {
    return dist_default().nonEmptyString(tagSuffix) && tagSuffix !== 'latest'
        ? `${version}-${tagSuffix}`
        : version;
}
async function buildAndPush({ imagePrefix, imagePrefixes, image, buildArg, buildArgs, buildOnly, cache, dryRun, tagSuffix, versioning, majorMinor, prune, platforms, skipLatestTag, }, tobuild) {
    const builds = [];
    const failed = [];
    const ver = (0,modules_versioning.get)(versioning);
    const versionsMap = new Map();
    const dfExists = await (0,util/* exists */.Gg)('df');
    if (majorMinor) {
        for (const version of tobuild.versions) {
            const minor = ver.getMinor(version);
            const major = ver.getMajor(version);
            const isStable = ver.isStable(version);
            if (isStable && dist_default().number(major) && `${major}` !== version) {
                versionsMap.set(`${major}`, version);
            }
            if (isStable &&
                dist_default().number(major) &&
                dist_default().number(minor) &&
                `${major}.${minor}` !== version) {
                versionsMap.set(`${major}.${minor}`, version);
            }
        }
    }
    // istanbul ignore if: only linux
    if (dfExists) {
        await (0,util/* exec */.GL)('df', ['-h']);
    }
    let shouldSign = false;
    if (!dryRun && !buildOnly) {
        shouldSign = await (0,util/* exists */.Gg)('cosign');
        if (!shouldSign) {
            logger/* default.warn */.Z.warn('Cosign is not installed. Skipping container signing');
        }
    }
    for (const version of tobuild.versions) {
        const tag = createTag(tagSuffix, version.replace(/\+.+/, ''));
        const imageVersion = `${imagePrefix}/${image}:${tag}`;
        (0,logger/* default */.Z)(`Building ${imageVersion}`);
        try {
            const minor = ver.getMinor(version);
            const major = ver.getMajor(version);
            const cacheFromTags = [tagSuffix ?? 'latest'];
            const cacheToTags = [];
            const tags = [];
            if (dist_default().number(major)) {
                const nTag = createTag(tagSuffix, `${major}`);
                cacheFromTags.push(nTag);
                if (versionsMap.get(`${major}`) === version) {
                    cacheToTags.push(nTag);
                    if (majorMinor) {
                        tags.push(nTag);
                    }
                }
            }
            if (dist_default().number(major) && dist_default().number(minor)) {
                const nTag = createTag(tagSuffix, `${major}.${minor}`);
                cacheFromTags.push(nTag);
                if (versionsMap.get(`${major}.${minor}`) === version) {
                    cacheToTags.push(nTag);
                    if (majorMinor) {
                        tags.push(nTag);
                    }
                }
            }
            if (version === tobuild.latestStable && skipLatestTag !== true) {
                cacheToTags.push(tagSuffix ?? 'latest');
                tags.push(tagSuffix ?? 'latest');
            }
            await build({
                image,
                imagePrefix,
                imagePrefixes,
                tag,
                tags,
                cache,
                cacheFromTags,
                cacheToTags,
                buildArgs: [...(buildArgs ?? []), `${buildArg}=${version}`],
                dryRun,
                platforms,
                push: !buildOnly,
            });
            if (!buildOnly && shouldSign) {
                (0,logger/* default */.Z)('Signing image', imageVersion);
                await cosign('sign', '--yes', imageVersion);
                for (const imageVersion of tags.map((tag) => `${imagePrefix}/${image}:${tag}`)) {
                    (0,logger/* default */.Z)('Signing image', imageVersion);
                    await cosign('sign', '--yes', imageVersion);
                }
            }
            (0,logger/* default */.Z)(`Build ${imageVersion}`);
            builds.push(version);
        }
        catch (err) {
            logger/* default.error */.Z.error(err);
            failed.push(version);
        }
        await (0,common/* dockerDf */.xd)();
        // istanbul ignore if: only linux
        if (dfExists) {
            await (0,util/* exec */.GL)('df', ['-h']);
        }
        if (prune) {
            await (0,common/* dockerPrune */.py)();
            // istanbul ignore if: only linux
            if (dfExists) {
                await (0,util/* exec */.GL)('df', ['-h']);
            }
        }
    }
    if (builds.length) {
        (0,logger/* default */.Z)('Build list:' + builds.join(' '));
    }
    if (failed.length) {
        logger/* default.warn */.Z.warn('Failed list:' + failed.join(' '));
        throw new Error('failed');
    }
}
async function generateImages(config) {
    const buildList = await (0,builds/* getBuildList */.k)(config);
    if (!buildList?.versions.length) {
        (0,core.setFailed)(`No versions found.`);
        return;
    }
    await buildAndPush(config, buildList);
}
async function run() {
    const dryRun = (0,util/* isDryRun */.Dz)();
    const configFile = (0,core.getInput)('config') || 'builder.json';
    const cfg = await (0,util/* readJson */.zr)(configFile);
    if (!dist_default().object(cfg)) {
        throw new Error('missing-config');
    }
    // TODO: validation
    if (!dist_default().string(cfg.image)) {
        cfg.image = (0,core.getInput)('image', { required: true });
    }
    if (!dist_default().string(cfg.buildArg)) {
        cfg.buildArg = cfg.image.toUpperCase() + '_VERSION';
    }
    await (0,utils_config/* readDockerConfig */._)(cfg);
    const config = {
        ...cfg,
        imagePrefix: (0,util/* getArg */.a8)('image-prefix')?.replace(/\/$/, '') || 'renovate',
        imagePrefixes: (0,util/* getArg */.a8)('image-prefixes', { multi: true })?.map((ip) => ip.replace(/\/$/, '')),
        image: cfg.image,
        depName: cfg.depName ?? cfg.image,
        buildArg: cfg.buildArg,
        buildArgs: (0,util/* getArg */.a8)('build-args', { multi: true }),
        tagSuffix: (0,util/* getArg */.a8)('tag-suffix') || undefined,
        ignoredVersions: cfg.ignoredVersions ?? [],
        dryRun,
        lastOnly: (0,core.getInput)('last-only') == 'true',
        buildOnly: (0,core.getInput)('build-only') == 'true',
        majorMinor: (0,util/* getArg */.a8)('major-minor') !== 'false',
        prune: (0,util/* getArg */.a8)('prune') === 'true',
        versioning: cfg.versioning ?? (0,datasource_common.getDefaultVersioning)(cfg.datasource),
        platforms: (0,util/* getArg */.a8)('platforms', { multi: true }),
    };
    if (dryRun) {
        (0,logger/* default */.Z)('GitHub Actions branch detected - Force building latest, no push');
        config.lastOnly = true;
    }
    (0,logger/* default */.Z)('config:', JSON.stringify(config));
    const token = (0,util/* getArg */.a8)('token');
    if (token) {
        (0,builds/* addHostRule */.H)({ matchHost: 'github.com', token });
    }
    await (0,buildx/* init */.S)();
    await generateImages(config);
    logger/* default.info */.Z.info(source.blue('Processing done:', config.image));
}


/***/ }),

/***/ 92536:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Dz": () => (/* binding */ isDryRun),
/* harmony export */   "GL": () => (/* binding */ exec),
/* harmony export */   "Gg": () => (/* binding */ exists),
/* harmony export */   "NC": () => (/* binding */ writeFile),
/* harmony export */   "Tl": () => (/* binding */ getDistro),
/* harmony export */   "a8": () => (/* binding */ getArg),
/* harmony export */   "bj": () => (/* binding */ getArch),
/* harmony export */   "oq": () => (/* binding */ getWorkspace),
/* harmony export */   "pJ": () => (/* binding */ readFile),
/* harmony export */   "sX": () => (/* binding */ readBuffer),
/* harmony export */   "zr": () => (/* binding */ readJson)
/* harmony export */ });
/* unused harmony exports getEnv, isCI, MultiArgsSplitRe, resolveFile */
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93977);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(49411);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5689);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(80002);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(84935);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_actions_exec__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _actions_io__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(11721);
/* harmony import */ var _actions_io__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_actions_io__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(34409);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_sindresorhus_is__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var find_up__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(68439);
/* harmony import */ var find_up__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(find_up__WEBPACK_IMPORTED_MODULE_6__);








const DEFAULT_DISTRO = 'focal';
async function exists(command) {
    try {
        await (0,_actions_io__WEBPACK_IMPORTED_MODULE_5__.which)(command, true);
    }
    catch {
        return false;
    }
    return true;
}
async function exec(cmd, args, options) {
    let stdout = '';
    let stderr = '';
    let code;
    try {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_3__.startGroup)(`${cmd} ${args.join(' ')}`);
        code = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_4__.exec)(cmd, args, {
            ...options,
            ignoreReturnCode: true,
            listeners: {
                stdout: (data) => {
                    stdout += data.toString();
                },
                stderr: (data) => {
                    stderr += data.toString();
                },
            },
        });
    }
    finally {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_3__.endGroup)();
    }
    if (code) {
        throw new _utils_types__WEBPACK_IMPORTED_MODULE_2__/* .ExecError */ .X(code, stdout, stderr, `${cmd} ${args.join(' ')}`);
    }
    return { code, stdout, stderr };
}
/**
 * Get environment variable or empty string.
 * Used for easy mocking.
 * @param key variable name
 */
function getEnv(key) {
    return process.env[key] ?? '';
}
function isCI() {
    return !!getEnv('CI');
}
function isDryRun() {
    const val = (0,_actions_core__WEBPACK_IMPORTED_MODULE_3__.getInput)('dry-run') || getEnv('DRY_RUN');
    return (!!val && val === 'true') || !isCI();
}
function getWorkspace() {
    return getEnv('GITHUB_WORKSPACE') || process.cwd();
}
function getDistro() {
    return getEnv('DISTRO') || getEnv('FLAVOR') || DEFAULT_DISTRO;
}
function getArch() {
    return getEnv('ARCH');
}
async function readJson(file) {
    const json = await readFile(file);
    return JSON.parse(json);
}
async function readFile(file) {
    const path = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    return await node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile(path, 'utf8');
}
async function readBuffer(file) {
    const path = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    return await node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile(path);
}
async function writeFile(file, contents) {
    const path = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    await node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.writeFile(path, contents);
}
const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;
function getArg(name, opts) {
    // istanbul ignore if: just for local testing where dash is not allowed
    if (process.env.NODE_ENV === 'debug') {
        name = name.replace(/-/g, '_');
    }
    const val = (0,_actions_core__WEBPACK_IMPORTED_MODULE_3__.getInput)(name, opts);
    return opts?.multi
        ? val.split(MultiArgsSplitRe).filter((_sindresorhus_is__WEBPACK_IMPORTED_MODULE_7___default().nonEmptyStringAndNotWhitespace))
        : val;
}
let _pkg;
/**
 * Resolve path for a file relative to renovate root directory (our package.json)
 * @param file a file to resolve
 */
async function resolveFile(file) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!_pkg) {
        _pkg = findUp('package.json', { cwd: __dirname, type: 'file' });
    }
    const pkg = await _pkg;
    // istanbul ignore if
    if (!pkg) {
        throw new Error('Missing package.json');
    }
    return join(pkg, '../', file);
}


/***/ }),

/***/ 26007:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "H": () => (/* reexport */ host_rules.add),
  "k": () => (/* binding */ getBuildList)
});

// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(39201);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/datasource/index.js
var modules_datasource = __webpack_require__(76079);
;// CONCATENATED MODULE: ./utils/datasource/index.ts


function register() {
    (0,logger/* default */.Z)('register datasources');
    (0,modules_datasource.getDatasources)();
}

// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/versioning/generic.js
var generic = __webpack_require__(49106);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/versioning/ubuntu/index.js
var ubuntu = __webpack_require__(90229);
;// CONCATENATED MODULE: ./utils/versioning/ubuntu.ts


const versions = new Map([
    ['bionic', { release: [18, 4] }],
    ['focal', { release: [20, 4] }],
]);
const id = 'ubuntu';
class CustomUbuntuVersioning extends generic.GenericVersioningApi {
    _parse(version) {
        let res = versions.get(version) ?? null;
        if (!res && ubuntu.api.isValid(version)) {
            res = { release: version.split('.').map((s) => parseInt(s, 10)) };
        }
        return res;
    }
    _compare(version1, version2) {
        const parsed1 = this._parse(version1);
        const parsed2 = this._parse(version2);
        // istanbul ignore if
        if (!parsed1 || !parsed2) {
            return 1;
        }
        const length = Math.max(parsed1.release.length, parsed2.release.length);
        for (let i = 0; i < length; i += 1) {
            const part1 = parsed1.release[i];
            const part2 = parsed2.release[i];
            // shorter is bigger 2.1 > 2.1.1
            // istanbul ignore if
            if (part1 === undefined) {
                return 1;
            }
            // istanbul ignore if
            if (part2 === undefined) {
                return -1;
            }
            if (part1 !== part2) {
                return part1 - part2;
            }
        }
        return 0;
    }
    isStable(version) {
        return versions.has(version) || ubuntu.api.isStable(version);
    }
}
const api = new CustomUbuntuVersioning();
/* harmony default export */ const versioning_ubuntu = ((/* unused pure expression or super */ null && (api)));

// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/modules/versioning/index.js
var modules_versioning = __webpack_require__(49415);
;// CONCATENATED MODULE: ./utils/versioning/index.ts



function versioning_register() {
    (0,logger/* default */.Z)('register versionings');
    const ds = (0,modules_versioning.getVersionings)();
    ds.set(id, api);
}

;// CONCATENATED MODULE: ./utils/renovate.ts



function renovate_register() {
    (0,logger/* default */.Z)('register renovate extensions');
    register();
    versioning_register();
}

// EXTERNAL MODULE: ../.yarn/cache/@sindresorhus-is-npm-4.6.0-7cad05c55e-83839f13da.zip/node_modules/@sindresorhus/is/dist/index.js
var dist = __webpack_require__(34409);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/util/host-rules.js
var host_rules = __webpack_require__(19935);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-37.8.1-b36a964941-279737a4de.zip/node_modules/renovate/dist/util/regex.js
var regex = __webpack_require__(46643);
// EXTERNAL MODULE: ../.yarn/cache/semver-npm-7.5.4-c4ad957fcd-12d8ad952f.zip/node_modules/semver/index.js
var semver = __webpack_require__(17824);
;// CONCATENATED MODULE: ./utils/builds.ts








renovate_register();
let latestStable;

function getVersions(versions) {
    return {
        releases: versions.map((version) => ({
            version,
        })),
    };
}
async function getBuildList({ allowedVersions, datasource, depName, lookupName, versioning, startVersion, ignoredVersions, lastOnly, forceUnstable, versions, latestVersion, maxVersions, extractVersion, }) {
    (0,logger/* default */.Z)('Looking up versions');
    const ver = (0,modules_versioning.get)(versioning);
    const pkgResult = versions
        ? getVersions(versions)
        : await (0,modules_datasource.getPkgReleases)({
            datasource,
            packageName: lookupName ?? depName,
            versioning,
            extractVersion,
        });
    if (!pkgResult) {
        return null;
    }
    let allVersions = pkgResult.releases
        .map((v) => v.version)
        .filter((v) => ver.isVersion(v) && ver.isCompatible(v, startVersion));
    // filter duplicate versions (16.0.2+7 == 16.0.2+8)
    allVersions = allVersions
        .reverse()
        .filter((v, i) => allVersions.findIndex((f) => ver.equals(f, v)) === i)
        .reverse();
    (0,logger/* default */.Z)(`Found ${allVersions.length} total versions`);
    if (!allVersions.length) {
        return null;
    }
    allVersions = allVersions
        .filter((v) => v === startVersion || ver.isGreaterThan(v, startVersion))
        .filter((v) => !ignoredVersions.includes(v));
    if (!forceUnstable) {
        (0,logger/* default */.Z)('Filter unstable versions');
        allVersions = allVersions.filter((v) => ver.isStable(v));
    }
    if (dist_default().string(allowedVersions)) {
        const isAllowedPred = (0,regex.configRegexPredicate)(allowedVersions);
        if (isAllowedPred) {
            allVersions = allVersions.filter((version) => isAllowedPred(version));
        }
        else if (ver.isValid(allowedVersions)) {
            allVersions = allVersions.filter((version) => ver.matches(version, allowedVersions));
        }
        else if (semver.validRange(allowedVersions)) {
            allVersions = allVersions.filter((v) => 
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            semver.satisfies(semver.coerce(v), allowedVersions));
        }
        else {
            logger/* default.warn */.Z.warn(`Invalid 'allowedVersions' options: ${allowedVersions}`);
            return null;
        }
    }
    if (!allVersions.length) {
        (0,logger/* default */.Z)('Nothing to build');
        return null;
    }
    (0,logger/* default */.Z)(`Found ${allVersions.length} versions within our range`);
    (0,logger/* default */.Z)(`Candidates:`, allVersions.join(', '));
    latestStable =
        latestVersion ??
            /* istanbul ignore next: not testable ts */
            pkgResult.tags?.latest ??
            allVersions.filter((v) => ver.isStable(v)).pop();
    (0,logger/* default */.Z)('Latest stable version is', latestStable);
    if (latestStable && !allVersions.includes(latestStable)) {
        logger/* default.warn */.Z.warn(`LatestStable '${latestStable}' not buildable, candidates:`, allVersions.join(', '));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastVersion = allVersions.at(-1);
    (0,logger/* default */.Z)('Most recent version is', lastVersion);
    if (dist_default().number(maxVersions) && maxVersions > 0) {
        (0,logger/* default */.Z)(`Building last ${maxVersions} version only`);
        allVersions = allVersions.slice(-maxVersions);
    }
    if (lastOnly) {
        (0,logger/* default */.Z)('Building last version only');
        allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
    }
    (0,logger/* default */.Z)('Build list:', allVersions.join(', '));
    return { versions: allVersions, latestStable };
}


/***/ }),

/***/ 84600:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "D": () => (/* binding */ getBinaryName),
/* harmony export */   "_": () => (/* binding */ readDockerConfig)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(92536);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5689);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(34409);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_sindresorhus_is__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var escape_string_regexp__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(50937);
/* harmony import */ var escape_string_regexp__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(escape_string_regexp__WEBPACK_IMPORTED_MODULE_2__);




const keys = [
    'datasource',
    'depName',
    'lookupName',
    'buildArg',
    'versioning',
    'latestVersion',
];
function checkArgs(cfg, groups) {
    for (const key of keys) {
        if (!_sindresorhus_is__WEBPACK_IMPORTED_MODULE_3___default().string(cfg[key]) && _sindresorhus_is__WEBPACK_IMPORTED_MODULE_3___default().nonEmptyString(groups[key])) {
            cfg[key] = groups[key];
        }
    }
}
async function readDockerConfig(cfg) {
    const buildArg = escape_string_regexp__WEBPACK_IMPORTED_MODULE_2__(cfg.buildArg);
    const dockerFileRe = new RegExp('# renovate: datasource=(?<datasource>[a-z-]+?) depName=(?<depName>.+?)(?: lookupName=(?<lookupName>.+?))?(?: versioning=(?<versioning>[a-z-]+?))?\\s' +
        `(?:ENV|ARG) ${buildArg}=(?<latestVersion>.*)\\s`, 'g');
    const dockerfile = await (0,_util__WEBPACK_IMPORTED_MODULE_0__/* .readFile */ .pJ)('Dockerfile');
    const m = dockerFileRe.exec(dockerfile);
    if (m && m.groups) {
        checkArgs(cfg, m.groups);
    }
}
function getBinaryName(cfg, version, sum) {
    const arch = (0,_util__WEBPACK_IMPORTED_MODULE_0__/* .getArch */ .bj)();
    const ext = sum ? `.${_types__WEBPACK_IMPORTED_MODULE_1__/* .sumType */ .N}` : '';
    if (_sindresorhus_is__WEBPACK_IMPORTED_MODULE_3___default().nonEmptyString(arch)) {
        return `${cfg.image}-${version}-${(0,_util__WEBPACK_IMPORTED_MODULE_0__/* .getDistro */ .Tl)()}-${arch}.tar.xz${ext}`;
    }
    return `${cfg.image}-${version}-${(0,_util__WEBPACK_IMPORTED_MODULE_0__/* .getDistro */ .Tl)()}.tar.xz${ext}`;
}


/***/ }),

/***/ 25258:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "S": () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(39201);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(26841);


const SupportedPlatforms = 'arm64';
async function init(use) {
    const buildx = await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('ls');
    if (buildx.stdout.includes('renovatebot-builder')) {
        (0,_logger__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z)('Buildx already initialized');
        process.env.BUILDX_BUILDER = 'renovatebot-builder';
        return;
    }
    _logger__WEBPACK_IMPORTED_MODULE_0__/* ["default"].info */ .Z.info('Configure buildx');
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .docker */ .e$)('info');
    // install emulations
    // https://github.com/docker/setup-qemu-action/blob/9d419fda7df46b2bcd38fadda3ec44f4748d25e1/src/main.ts#L22
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerRun */ .Yo)('--privileged', 'tonistiigi/binfmt', '--install', SupportedPlatforms);
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('version');
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('create', '--name', 'renovatebot-builder', '--driver', 'docker-container');
    // istanbul ignore if
    if (use) {
        await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('use', 'renovatebot-builder');
    }
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('inspect', '--bootstrap', 'renovatebot-builder');
    process.env.BUILDX_BUILDER = 'renovatebot-builder';
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('ls');
}


/***/ }),

/***/ 26841:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$V": () => (/* binding */ DockerPlatform),
/* harmony export */   "WR": () => (/* binding */ dockerBuildx),
/* harmony export */   "Yo": () => (/* binding */ dockerRun),
/* harmony export */   "e$": () => (/* binding */ docker),
/* harmony export */   "py": () => (/* binding */ dockerPrune),
/* harmony export */   "xd": () => (/* binding */ dockerDf)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(92536);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(39201);


var DockerPlatform;
(function (DockerPlatform) {
    DockerPlatform["x86_64"] = "linux/amd64";
    DockerPlatform["aarch64"] = "linux/arm64";
})(DockerPlatform || (DockerPlatform = {}));
async function docker(...args) {
    return await (0,_util__WEBPACK_IMPORTED_MODULE_0__/* .exec */ .GL)('docker', [...args]);
}
async function dockerRun(...args) {
    await docker('run', '--rm', ...args);
}
async function dockerBuildx(...args) {
    return await docker('buildx', ...args);
}
async function dockerPrune() {
    (0,_logger__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z)('Pruning docker system');
    await docker('system', 'prune', '--force', '--all');
}
async function dockerDf() {
    (0,_logger__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z)('Docker system disk usage');
    await docker('system', 'df');
}


/***/ }),

/***/ 5689:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "N": () => (/* binding */ sumType),
/* harmony export */   "X": () => (/* binding */ ExecError)
/* harmony export */ });
class ExecError extends Error {
    code;
    stdout;
    stderr;
    cmd;
    name = 'ExecError';
    constructor(code, stdout, stderr, cmd) {
        super(`ExecError: (${code}) ` + stderr.split('\n').slice(-10).join('\n'));
        this.code = code;
        this.stdout = stdout;
        this.stderr = stderr;
        this.cmd = cmd;
    }
}
const sumType = 'sha512';


/***/ })

};
;
//# sourceMappingURL=396.index.js.map