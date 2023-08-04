"use strict";
exports.id = 83;
exports.ids = [83];
exports.modules = {

/***/ 93083:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "run": () => (/* binding */ run)
});

// EXTERNAL MODULE: ./util.ts
var util = __webpack_require__(25575);
// EXTERNAL MODULE: ./utils/builds.ts + 4 modules
var utils_builds = __webpack_require__(31107);
// EXTERNAL MODULE: ./utils/docker/buildx.ts
var buildx = __webpack_require__(96664);
// EXTERNAL MODULE: external "node:timers/promises"
var promises_ = __webpack_require__(99397);
// EXTERNAL MODULE: ./utils/config.ts
var config = __webpack_require__(37039);
// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(89142);
// EXTERNAL MODULE: ../.yarn/cache/@actions-github-npm-5.1.1-61d3d8cdac-2210bd7f8e.zip/node_modules/@actions/github/lib/github.js
var github = __webpack_require__(36679);
// EXTERNAL MODULE: ../.yarn/cache/got-npm-11.8.6-89e7cd5d67-bbc783578a.zip/node_modules/got/dist/source/index.js
var source = __webpack_require__(1846);
var source_default = /*#__PURE__*/__webpack_require__.n(source);
;// CONCATENATED MODULE: ./utils/github.ts
// istanbul ignore file







let releaseCache = null;
function getBody(cfg, version) {
    return `### Bug Fixes

* **deps:** update dependency ${cfg.image} to v${version}`;
}
function isRequestError(err) {
    return err instanceof Error && 'status' in err;
}
async function findRelease(api, version) {
    try {
        if (!releaseCache) {
            const cache = new Map();
            const rels = await api.paginate(api.rest.repos.listReleases, {
                ...github.context.repo,
                per_page: 100,
            });
            for (const rel of rels) {
                cache.set(rel.tag_name, rel);
            }
            releaseCache = cache;
        }
        return releaseCache.get(version) ?? null;
    }
    catch (e) {
        if (isRequestError(e) && e.status !== 404) {
            throw e;
        }
    }
    return null;
}
async function getRelease(api, version) {
    try {
        const { data } = await api.rest.repos.getReleaseByTag({
            ...github.context.repo,
            tag: version,
        });
        releaseCache?.set(version, data);
        return data;
    }
    catch (err) {
        if (isRequestError(err) && err.status == 404) {
            return null;
        }
        throw err;
    }
}
async function createRelease(api, cfg, version, retry = true) {
    try {
        let data = await getRelease(api, version);
        if (data) {
            return data;
        }
        ({ data } = await api.rest.repos.createRelease({
            ...github.context.repo,
            tag_name: version,
            name: version,
            body: getBody(cfg, version),
        }));
        releaseCache?.set(version, data);
        return data;
    }
    catch (err) {
        if (retry &&
            isRequestError(err) &&
            err.status == 422 &&
            err.response?.data) {
            (0,logger/* default */.Z)('Release probably created by other process, retrying:', version, err.message);
            await (0,promises_.setTimeout)(250);
            return await createRelease(api, cfg, version, false);
        }
        throw err;
    }
}
async function updateRelease(api, cfg, version) {
    const body = getBody(cfg, version);
    const rel = await findRelease(api, version);
    if (rel == null || (rel.name === version && rel.body === body)) {
        return;
    }
    const { data } = await api.rest.repos.updateRelease({
        ...github.context.repo,
        release_id: rel.id,
        name: version,
        body,
    });
    releaseCache?.set(data.tag_name, data);
}
async function uploadAsset(api, cfg, version, sum) {
    try {
        let rel = await findRelease(api, version);
        let release_id = rel?.id ?? 0;
        if (rel == null) {
            rel = await createRelease(api, cfg, version);
            release_id = rel.id;
        }
        const name = (0,config/* getBinaryName */.D)(cfg, version, sum);
        const buffer = await (0,util/* readBuffer */.sX)(`.cache/${name}`);
        const { data } = await api.rest.repos.uploadReleaseAsset({
            ...github.context.repo,
            release_id,
            url: rel.upload_url,
            // fake because api issues https://github.com/octokit/octokit.js/discussions/2087
            data: buffer,
            name,
            headers: {
                'content-type': 'application/octet-stream',
                'content-length': buffer.length,
            },
        });
        // cache asset
        rel.assets.push(data);
    }
    catch (e) {
        if (isRequestError(e) && e.status !== 404) {
            throw e;
        }
    }
}
async function hasAsset(api, cfg, version, sum) {
    return (await findAsset(api, cfg, version, sum)) != null;
}
async function findAsset(api, cfg, version, sum) {
    const rel = await findRelease(api, version);
    const name = (0,config/* getBinaryName */.D)(cfg, version, sum);
    return rel?.assets.find((a) => a.name === name) ?? null;
}
async function downloadAsset(api, cfg, version) {
    const asset = await findAsset(api, cfg, version);
    if (!asset) {
        return false;
    }
    try {
        const buffer = await source_default()({
            url: asset.browser_download_url,
            responseType: 'buffer',
            resolveBodyOnly: true,
        });
        if (buffer.length != asset.size) {
            logger/* default.error */.Z.error('Wrong binary size');
            return false;
        }
        const name = (0,config/* getBinaryName */.D)(cfg, version);
        await (0,util/* writeFile */.NC)(`.cache/${name}`, buffer);
    }
    catch (e) {
        // eslint-disable-next-line
        (0,logger/* default */.Z)(`Version ${version} failed: ${e.message}`, e.stack);
        return false;
    }
    return true;
}

// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__(6005);
// EXTERNAL MODULE: ./utils/types.ts
var types = __webpack_require__(45602);
;// CONCATENATED MODULE: ./utils/sum.ts




function hash(file) {
    return (0,external_node_crypto_.createHash)(types/* sumType */.N).update(file).digest('hex');
}
async function createChecksum(cfg, version) {
    const name = (0,config/* getBinaryName */.D)(cfg, version);
    const sumName = (0,config/* getBinaryName */.D)(cfg, version, true);
    const buffer = await (0,util/* readBuffer */.sX)(`.cache/${name}`);
    const sum = hash(buffer);
    await (0,util/* writeFile */.NC)(`.cache/${sumName}`, sum);
}

// EXTERNAL MODULE: ./utils/docker/common.ts
var common = __webpack_require__(89982);
// EXTERNAL MODULE: ../.yarn/cache/@actions-core-npm-1.10.0-6885534582-0a75621e00.zip/node_modules/@actions/core/lib/core.js
var core = __webpack_require__(91862);
// EXTERNAL MODULE: ../.yarn/cache/@sindresorhus-is-npm-4.6.0-7cad05c55e-83839f13da.zip/node_modules/@sindresorhus/is/dist/index.js
var dist = __webpack_require__(76827);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/modules/datasource/common.js
var datasource_common = __webpack_require__(90368);
;// CONCATENATED MODULE: ./commands/binary/utils.ts







async function getConfig() {
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
        ignoredVersions: cfg.ignoredVersions ?? [],
        dryRun: (0,util/* isDryRun */.Dz)(),
        lastOnly: (0,util/* getArg */.a8)('last-only') == 'true',
        buildArgs: (0,util/* getArg */.a8)('build-args', { multi: true }),
        versioning: cfg.versioning ?? (0,datasource_common.getDefaultVersioning)(cfg.datasource),
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

// EXTERNAL MODULE: ../.yarn/cache/chalk-npm-4.1.2-ba8b67ab80-fe75c9d5c7.zip/node_modules/chalk/source/index.js
var chalk_source = __webpack_require__(9067);
// EXTERNAL MODULE: ../.yarn/cache/shelljs-npm-0.8.5-44be43f84a-7babc46f73.zip/node_modules/shelljs/shell.js
var shell = __webpack_require__(33291);
;// CONCATENATED MODULE: ./commands/binary/index.ts










let toBuild = 99;
async function run() {
    try {
        logger/* default.info */.Z.info('Builder started');
        const ws = (0,util/* getWorkspace */.oq)();
        const cfg = await getConfig();
        if (cfg.dryRun) {
            logger/* default.warn */.Z.warn(chalk_source.yellow('[DRY_RUN] detected'));
            cfg.lastOnly = true;
        }
        const token = (0,util/* getArg */.a8)('token', { required: true });
        const api = (0,github.getOctokit)(token);
        (0,utils_builds/* addHostRule */.H)({ matchHost: 'github.com', token });
        (0,logger/* default */.Z)('config:', JSON.stringify(cfg));
        const builds = await (0,utils_builds/* getBuildList */.k)(cfg);
        if (!builds?.versions.length) {
            (0,core.setFailed)(`No versions found.`);
            return;
        }
        shell.mkdir('-p', `${ws}/.cache`);
        await (0,buildx/* init */.S)();
        await createBuilderImage(ws, cfg);
        const failed = [];
        for (const version of builds.versions) {
            await updateRelease(api, cfg, version);
            if (await hasAsset(api, cfg, version)) {
                if (!(await hasAsset(api, cfg, version, true))) {
                    (0,logger/* default */.Z)('Creating checksum for existing version:', version);
                    if (!(await downloadAsset(api, cfg, version))) {
                        logger/* default.warn */.Z.warn(chalk_source.yellow('Missing binary asset:'), version);
                        failed.push(version);
                        continue;
                    }
                    try {
                        await createChecksum(cfg, version);
                        if (cfg.dryRun) {
                            logger/* default.warn */.Z.warn(chalk_source.yellow('[DRY_RUN] Would upload release asset:'), version);
                        }
                        else {
                            (0,logger/* default */.Z)('Uploading release:', version);
                            await uploadAsset(api, cfg, version, true);
                        }
                    }
                    catch (e) {
                        failed.push(version);
                        // eslint-disable-next-line
                        (0,logger/* default */.Z)(`Version ${version} failed: ${e.message}`);
                    }
                    continue;
                }
                else if (cfg.dryRun) {
                    logger/* default.warn */.Z.warn(chalk_source.yellow('[DRY_RUN] Would skipp existing version:'), version);
                }
                else {
                    (0,logger/* default */.Z)('Skipping existing version:', version);
                    continue;
                }
            }
            // istanbul ignore if
            if (toBuild-- <= 0) {
                logger/* default.info */.Z.info('Build limit reached');
                break;
            }
            logger/* default.info */.Z.info('Processing version:', version);
            try {
                (0,logger/* default */.Z)('Runing builder:', version);
                await runBuilder(ws, version);
                await createChecksum(cfg, version);
                if (cfg.dryRun) {
                    logger/* default.warn */.Z.warn(chalk_source.yellow('[DRY_RUN] Would upload release asset:'), version);
                }
                else {
                    (0,logger/* default */.Z)('Uploading release:', version);
                    await uploadAsset(api, cfg, version);
                    await uploadAsset(api, cfg, version, true);
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
        (0,logger/* default */.Z)(error.stack);
        (0,core.setFailed)(error);
    }
}


/***/ }),

/***/ 25575:
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
/* harmony import */ var _utils_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(45602);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(91862);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(23464);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_actions_exec__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _actions_io__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(33658);
/* harmony import */ var _actions_io__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_actions_io__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(76827);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_sindresorhus_is__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var find_up__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(58614);
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

/***/ 31107:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "H": () => (/* reexport */ host_rules.add),
  "k": () => (/* binding */ getBuildList)
});

// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(89142);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/modules/datasource/index.js
var modules_datasource = __webpack_require__(33128);
;// CONCATENATED MODULE: ./utils/datasource/index.ts


function register() {
    (0,logger/* default */.Z)('register datasources');
    (0,modules_datasource.getDatasources)();
}

// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/modules/versioning/generic.js
var generic = __webpack_require__(55878);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/modules/versioning/ubuntu/index.js
var ubuntu = __webpack_require__(25980);
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

// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/modules/versioning/index.js
var modules_versioning = __webpack_require__(47395);
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
var dist = __webpack_require__(76827);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/util/host-rules.js
var host_rules = __webpack_require__(45341);
// EXTERNAL MODULE: ../.yarn/cache/renovate-npm-36.27.1-5d582d29b1-a0bc5363b5.zip/node_modules/renovate/dist/util/regex.js
var regex = __webpack_require__(45610);
// EXTERNAL MODULE: ../.yarn/cache/semver-npm-7.5.4-c4ad957fcd-12d8ad952f.zip/node_modules/semver/index.js
var semver = __webpack_require__(50112);
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

/***/ 37039:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "D": () => (/* binding */ getBinaryName),
/* harmony export */   "_": () => (/* binding */ readDockerConfig)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(25575);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(45602);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(76827);
/* harmony import */ var _sindresorhus_is__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_sindresorhus_is__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var escape_string_regexp__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15387);
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

/***/ 96664:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "S": () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89142);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89982);


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

/***/ 89982:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$V": () => (/* binding */ DockerPlatform),
/* harmony export */   "WR": () => (/* binding */ dockerBuildx),
/* harmony export */   "Yo": () => (/* binding */ dockerRun),
/* harmony export */   "e$": () => (/* binding */ docker),
/* harmony export */   "py": () => (/* binding */ dockerPrune),
/* harmony export */   "xd": () => (/* binding */ dockerDf)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(25575);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89142);


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

/***/ 45602:
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
//# sourceMappingURL=83.index.js.map