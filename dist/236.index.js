exports.id = 236;
exports.ids = [236];
exports.modules = {

/***/ 90236:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "run": () => (/* binding */ run)
});

// EXTERNAL MODULE: ../node_modules/source-map-support/register.js
var register = __webpack_require__(83674);
// EXTERNAL MODULE: ../node_modules/@actions/core/lib/core.js
var core = __webpack_require__(75316);
// EXTERNAL MODULE: ../node_modules/chalk/source/index.js
var source = __webpack_require__(10816);
// EXTERNAL MODULE: ../node_modules/renovate/dist/datasource/index.js
var dist_datasource = __webpack_require__(184);
// EXTERNAL MODULE: ../node_modules/renovate/dist/versioning/index.js
var dist_versioning = __webpack_require__(11730);
// EXTERNAL MODULE: ../node_modules/shelljs/shell.js
var shell = __webpack_require__(26062);
// EXTERNAL MODULE: ./util.ts
var util = __webpack_require__(41838);
// EXTERNAL MODULE: ./utils/docker/buildx.ts
var buildx = __webpack_require__(14413);
// EXTERNAL MODULE: ../node_modules/@actions/github/lib/github.js
var github = __webpack_require__(32189);
// EXTERNAL MODULE: ../node_modules/@sindresorhus/is/dist/index.js
var dist = __webpack_require__(4040);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
;// CONCATENATED MODULE: ./utils/github.ts
// istanbul ignore file




let releaseCache = null;
function getBinaryName(cfg, version) {
    const arch = (0,util/* getArch */.bj)();
    if (dist_default().nonEmptyString(arch)) {
        return `${cfg.image}-${version}-${(0,util/* getDistro */.Tl)()}-${arch}.tar.xz`;
    }
    return `${cfg.image}-${version}-${(0,util/* getDistro */.Tl)()}.tar.xz`;
}
function getBody(cfg, version) {
    return `### Bug Fixes

* **deps:** update dependency ${cfg.image} to v${version}`;
}
async function findRelease(api, version) {
    var _a;
    try {
        if (!releaseCache) {
            const cache = new Map();
            const rels = await api.paginate(api.repos.listReleases, {
                ...github.context.repo,
                per_page: 100,
            });
            for (const rel of rels) {
                cache.set(rel.tag_name, rel);
            }
            releaseCache = cache;
        }
        return (_a = releaseCache.get(version)) !== null && _a !== void 0 ? _a : null;
    }
    catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (e.status !== 404) {
            throw e;
        }
    }
    return null;
}
async function createRelease(api, cfg, version) {
    const { data } = await api.repos.createRelease({
        ...github.context.repo,
        tag_name: version,
        name: version,
        body: getBody(cfg, version),
    });
    releaseCache === null || releaseCache === void 0 ? void 0 : releaseCache.set(data.tag_name, data);
    return data;
}
async function updateRelease(api, cfg, version) {
    const body = getBody(cfg, version);
    const rel = await findRelease(api, version);
    if (rel == null || (rel.name === version && rel.body === body)) {
        return;
    }
    const { data } = await api.repos.updateRelease({
        ...github.context.repo,
        release_id: rel.id,
        name: version,
        body,
    });
    releaseCache === null || releaseCache === void 0 ? void 0 : releaseCache.set(data.tag_name, data);
}
async function uploadAsset(api, cfg, version) {
    var _a;
    try {
        let rel = await findRelease(api, version);
        let release_id = (_a = rel === null || rel === void 0 ? void 0 : rel.id) !== null && _a !== void 0 ? _a : 0;
        if (rel == null) {
            rel = await createRelease(api, cfg, version);
            release_id = rel.id;
        }
        const name = getBinaryName(cfg, version);
        // fake because api issues
        // https://github.com/octokit/octokit.js/discussions/2087
        const data = (await (0,util/* readBuffer */.sX)(`.cache/${name}`));
        const { data: asset } = await api.repos.uploadReleaseAsset({
            ...github.context.repo,
            release_id,
            data,
            name,
            headers: {
                'content-type': 'application/octet-stream',
                'content-length': data.length,
            },
        });
        // cache assed
        rel.assets.push(asset);
    }
    catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (e.status !== 404) {
            throw e;
        }
    }
}
async function hasAsset(api, cfg, version) {
    var _a;
    const rel = await findRelease(api, version);
    const name = getBinaryName(cfg, version);
    return (_a = rel === null || rel === void 0 ? void 0 : rel.assets.some((a) => a.name === name)) !== null && _a !== void 0 ? _a : false;
}

// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(33433);
// EXTERNAL MODULE: ./utils/config.ts
var config = __webpack_require__(21490);
// EXTERNAL MODULE: ./utils/docker/common.ts
var common = __webpack_require__(43673);
;// CONCATENATED MODULE: ./commands/binary/utils.ts






async function getConfig() {
    var _a;
    const configFile = (0,core.getInput)('config') || 'builder.json';
    const cfg = await (0,util/* readJson */.zr)(configFile);
    if (!dist_default().object(cfg)) {
        throw new Error('missing-config');
    }
    if (!dist_default().string(cfg.image)) {
        cfg.image = (0,core.getInput)('image', { required: true });
    }
    if (!dist_default().string(cfg.buildArg)) {
        cfg.buildArg = cfg.image.toUpperCase() + '_VERSION';
    }
    await (0,config/* readDockerConfig */._)(cfg);
    return {
        ...cfg,
        ignoredVersions: (_a = cfg.ignoredVersions) !== null && _a !== void 0 ? _a : [],
        dryRun: (0,util/* isDryRun */.Dz)(),
        lastOnly: (0,util/* getArg */.a8)('last-only') == 'true',
        buildArgs: (0,util/* getArg */.a8)('build-args', { multi: true }),
    };
}
async function createBuilderImage(ws, { buildArgs }) {
    (0,logger/* default */.Z)('Creating builder image');
    const args = [
        'build',
        '--load',
        '-t',
        'builder',
        '--build-arg',
        `DISTRO=${(0,util/* getDistro */.Tl)()}`,
    ];
    const arch = (0,util/* getArch */.bj)();
    if (dist_default().nonEmptyString(arch)) {
        args.push('--platform', common/* DockerPlatform */.$V[arch]);
    }
    if (dist_default().nonEmptyArray(buildArgs)) {
        args.push(...buildArgs.map((b) => `--build-arg=${b}`));
    }
    await (0,common/* dockerBuildx */.WR)(...args, ws);
}
async function runBuilder(ws, version) {
    const args = ['--name', 'builder', '--volume', `${ws}/.cache:/cache`];
    const arch = (0,util/* getArch */.bj)();
    if (dist_default().nonEmptyString(arch)) {
        args.push('--platform', common/* DockerPlatform */.$V[arch]);
    }
    await (0,common/* dockerRun */.Yo)(...args, 'builder', version);
}

;// CONCATENATED MODULE: ./commands/binary/index.ts











let builds = 99;
let latestStable;
function getVersions(versions) {
    return {
        releases: versions.map((version) => ({
            version,
        })),
    };
}
async function getBuildList({ datasource, depName, versioning, startVersion, ignoredVersions, lastOnly, forceUnstable, versions, latestVersion, }) {
    var _a;
    (0,logger/* default */.Z)('Looking up versions');
    const ver = (0,dist_versioning.get)(versioning);
    const pkgResult = versions
        ? getVersions(versions)
        : await (0,dist_datasource.getPkgReleases)({
            datasource,
            depName,
            versioning,
        });
    if (!pkgResult) {
        return [];
    }
    let allVersions = pkgResult.releases
        .map((v) => v.version)
        .filter((v) => ver.isVersion(v) && ver.isCompatible(v, startVersion));
    (0,logger/* default */.Z)(`Found ${allVersions.length} total versions`);
    if (!allVersions.length) {
        return [];
    }
    allVersions = allVersions
        .filter((v) => /* istanbul ignore next */ { var _a; /* istanbul ignore next */ return !((_a = ver.isLessThanRange) === null || _a === void 0 ? void 0 : _a.call(ver, v, startVersion)); })
        .filter((v) => !ignoredVersions.includes(v));
    if (!forceUnstable) {
        (0,logger/* default */.Z)('Filter unstable versions');
        allVersions = allVersions.filter((v) => ver.isStable(v));
    }
    (0,logger/* default */.Z)(`Found ${allVersions.length} versions within our range`);
    (0,logger/* default */.Z)(`Candidates:`, allVersions.join(', '));
    latestStable =
        latestVersion ||
            (
            /* istanbul ignore next: not testable ts */
            (_a = pkgResult.tags) === null || _a === void 0 ? void 0 : _a.latest) ||
            allVersions.filter((v) => ver.isStable(v)).pop();
    (0,logger/* default */.Z)('Latest stable version is ', latestStable);
    if (latestStable && !allVersions.includes(latestStable)) {
        logger/* default.warn */.Z.warn(`LatestStable '${latestStable}' not buildable, candidates: `, allVersions.join(', '));
    }
    const lastVersion = allVersions[allVersions.length - 1];
    (0,logger/* default */.Z)('Most recent version is ', lastVersion);
    if (lastOnly) {
        (0,logger/* default */.Z)('Building last version only');
        allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
    }
    // istanbul ignore else
    if (allVersions.length) {
        (0,logger/* default */.Z)('Build list: ', allVersions.join(', '));
    }
    else {
        (0,logger/* default */.Z)('Nothing to build');
    }
    return allVersions;
}
async function run() {
    try {
        logger/* default.info */.Z.info('Builder started');
        const ws = (0,util/* getWorkspace */.oq)();
        const cfg = await getConfig();
        if (cfg.dryRun) {
            logger/* default.warn */.Z.warn(source.yellow('[DRY_RUN] detected'));
            cfg.lastOnly = true;
        }
        const token = (0,util/* getArg */.a8)('token', { required: true });
        const api = (0,github.getOctokit)(token);
        (0,logger/* default */.Z)('config:', JSON.stringify(cfg));
        const versions = await getBuildList(cfg);
        if (versions.length === 0) {
            (0,core.setFailed)(`No versions found.`);
            return;
        }
        shell.mkdir('-p', `${ws}/.cache`);
        await (0,buildx/* init */.S)();
        await createBuilderImage(ws, cfg);
        const failed = [];
        for (const version of versions) {
            await updateRelease(api, cfg, version);
            if (await hasAsset(api, cfg, version)) {
                if (cfg.dryRun) {
                    logger/* default.warn */.Z.warn(source.yellow('[DRY_RUN] Would skipp existing version:'), version);
                }
                else {
                    (0,logger/* default */.Z)('Skipping existing version:', version);
                    continue;
                }
            }
            // istanbul ignore if
            if (builds-- <= 0) {
                logger/* default.info */.Z.info('Build limit reached');
                break;
            }
            logger/* default.info */.Z.info('Processing version:', version);
            try {
                (0,logger/* default */.Z)('Runing builder:', version);
                await runBuilder(ws, version);
                if (cfg.dryRun) {
                    logger/* default.warn */.Z.warn(source.yellow('[DRY_RUN] Would upload release asset:'), version);
                }
                else {
                    (0,logger/* default */.Z)('Uploading release:', version);
                    await uploadAsset(api, cfg, version);
                }
            }
            catch (e) {
                failed.push(version);
                // eslint-disable-next-line
                (0,logger/* default */.Z)(`Version ${version} failed: ${e.message}`, e.stack);
            }
        }
        if (failed.length) {
            (0,core.setFailed)(`Versions failed: ${failed.join(', ')}`);
        }
    }
    catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (0,logger/* default */.Z)(error.stack);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (0,core.setFailed)(error.message);
    }
}


/***/ }),

/***/ 41838:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GL": () => (/* binding */ exec),
/* harmony export */   "Dz": () => (/* binding */ isDryRun),
/* harmony export */   "oq": () => (/* binding */ getWorkspace),
/* harmony export */   "Tl": () => (/* binding */ getDistro),
/* harmony export */   "bj": () => (/* binding */ getArch),
/* harmony export */   "zr": () => (/* binding */ readJson),
/* harmony export */   "pJ": () => (/* binding */ readFile),
/* harmony export */   "sX": () => (/* binding */ readBuffer),
/* harmony export */   "a8": () => (/* binding */ getArg)
/* harmony export */ });
/* unused harmony exports getEnv, isCI, MultiArgsSplitRe, resolveFile */
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(35747);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(85622);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(75316);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(110);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_actions_exec__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var find_up__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71368);
/* harmony import */ var find_up__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(find_up__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _utils_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(17321);






const DEFAULT_DISTRO = 'focal';
/** webpack workaround for dynamic require */
const _require = eval('require');
function _import(path) {
    return Promise.resolve(_require(path));
}
async function exec(cmd, args, options) {
    let stdout = '';
    let stderr = '';
    let code;
    try {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_2__.startGroup)(`${cmd} ${args.join(' ')}`);
        code = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_3__.exec)(cmd, args, {
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
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_2__.endGroup)();
    }
    if (code) {
        throw new _utils_types__WEBPACK_IMPORTED_MODULE_5__/* .ExecError */ .X(code, stdout, stderr, `${cmd} ${args.join(' ')}`);
    }
    return { code, stdout, stderr };
}
/**
 * Get environment variable or empty string.
 * Used for easy mocking.
 * @param key variable name
 */
function getEnv(key) {
    var _a;
    return (_a = process.env[key]) !== null && _a !== void 0 ? _a : '';
}
function isCI() {
    return !!getEnv('CI');
}
function isDryRun() {
    const val = (0,_actions_core__WEBPACK_IMPORTED_MODULE_2__.getInput)('dry-run') || getEnv('DRY_RUN');
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
    const path = (0,path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    const res = await _import(path);
    // istanbul ignore next
    return 'default' in res ? res === null || res === void 0 ? void 0 : res.default : res;
}
async function readFile(file) {
    const path = (0,path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    return await fs__WEBPACK_IMPORTED_MODULE_0__.promises.readFile(path, 'utf8');
}
async function readBuffer(file) {
    const path = (0,path__WEBPACK_IMPORTED_MODULE_1__.join)(getWorkspace(), file);
    return await fs__WEBPACK_IMPORTED_MODULE_0__.promises.readFile(path);
}
const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;
function getArg(name, opts) {
    const val = (0,_actions_core__WEBPACK_IMPORTED_MODULE_2__.getInput)(name, opts);
    return (opts === null || opts === void 0 ? void 0 : opts.multi) ? val.split(MultiArgsSplitRe).filter(Boolean) : val;
}
let _pkg;
/**
 * Resolve path for a file relative to renovate root directory (our package.json)
 * @param file a file to resolve
 */
async function resolveFile(file) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!_pkg) {
        _pkg = find_up__WEBPACK_IMPORTED_MODULE_4__('package.json', { cwd: __dirname, type: 'file' });
    }
    const pkg = await _pkg;
    // istanbul ignore if
    if (!pkg) {
        throw new Error('Missing package.json');
    }
    return (0,path__WEBPACK_IMPORTED_MODULE_1__.join)(pkg, '../', file);
}


/***/ }),

/***/ 21490:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_": () => (/* binding */ readDockerConfig)
/* harmony export */ });
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4040);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_sindresorhus_is__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(41838);


const keys = [
    'datasource',
    'depName',
    'buildArg',
    'versioning',
    'latestVersion',
];
function checkArgs(cfg, groups) {
    for (const key of keys) {
        if (!_sindresorhus_is__WEBPACK_IMPORTED_MODULE_1___default().string(cfg[key]) && _sindresorhus_is__WEBPACK_IMPORTED_MODULE_1___default().nonEmptyString(groups[key])) {
            cfg[key] = groups[key];
        }
    }
}
async function readDockerConfig(cfg) {
    const dockerFileRe = new RegExp('# renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)( versioning=(?<versioning>.*?))?\\s' +
        `(?:ENV|ARG) ${cfg.buildArg}=(?<latestVersion>.*)\\s`, 'g');
    const dockerfile = await (0,_util__WEBPACK_IMPORTED_MODULE_0__/* .readFile */ .pJ)('Dockerfile');
    const m = dockerFileRe.exec(dockerfile);
    if (m && m.groups) {
        checkArgs(cfg, m.groups);
    }
}


/***/ }),

/***/ 14413:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "S": () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33433);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(43673);


const SupportedPlatforms = 'arm64';
async function init() {
    const buildx = await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('ls');
    if (buildx.stdout.includes('renovatebot-builder')) {
        (0,_logger__WEBPACK_IMPORTED_MODULE_0__/* .default */ .Z)('Buildx already initialized');
        return;
    }
    _logger__WEBPACK_IMPORTED_MODULE_0__/* .default.info */ .Z.info('Configure buildx');
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .docker */ .e$)('info');
    // install emulations
    // https://github.com/docker/setup-qemu-action/blob/9d419fda7df46b2bcd38fadda3ec44f4748d25e1/src/main.ts#L22
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerRun */ .Yo)('--privileged', 'tonistiigi/binfmt', '--install', SupportedPlatforms);
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('version');
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('create', '--name', 'renovatebot-builder', '--driver', 'docker-container', '--use');
    await (0,_common__WEBPACK_IMPORTED_MODULE_1__/* .dockerBuildx */ .WR)('inspect', '--bootstrap');
}


/***/ }),

/***/ 43673:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$V": () => (/* binding */ DockerPlatform),
/* harmony export */   "e$": () => (/* binding */ docker),
/* harmony export */   "Yo": () => (/* binding */ dockerRun),
/* harmony export */   "WR": () => (/* binding */ dockerBuildx),
/* harmony export */   "zJ": () => (/* binding */ dockerTag),
/* harmony export */   "py": () => (/* binding */ dockerPrune),
/* harmony export */   "xd": () => (/* binding */ dockerDf)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(41838);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33433);


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
async function dockerTag({ image, imagePrefix, src, tgt, }) {
    return await (0,_util__WEBPACK_IMPORTED_MODULE_0__/* .exec */ .GL)('docker', [
        'tag',
        `${imagePrefix}/${image}:${src}`,
        `${imagePrefix}/${image}:${tgt}`,
    ]);
}
async function dockerPrune() {
    (0,_logger__WEBPACK_IMPORTED_MODULE_1__/* .default */ .Z)('Pruning docker system');
    await docker('system', 'prune', '--force', '--all');
}
async function dockerDf() {
    (0,_logger__WEBPACK_IMPORTED_MODULE_1__/* .default */ .Z)('Docker system disk usage');
    await docker('system', 'df');
}


/***/ }),

/***/ 17321:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "X": () => (/* binding */ ExecError)
/* harmony export */ });
class ExecError extends Error {
    constructor(code, stdout, stderr, cmd) {
        super(`ExecError: (${code}) ` + stderr.split('\n').slice(-10).join('\n'));
        this.code = code;
        this.stdout = stdout;
        this.stderr = stderr;
        this.cmd = cmd;
        this.name = 'ExecError';
    }
}


/***/ })

};
;
//# sourceMappingURL=236.index.js.map