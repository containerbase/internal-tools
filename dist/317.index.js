exports.id = 317;
exports.ids = [317];
exports.modules = {

/***/ 97390:
/***/ ((module) => {

"use strict";


// From https://github.com/sindresorhus/random-int/blob/c37741b56f76b9160b0b63dae4e9c64875128146/index.js#L13-L15
const randomInteger = (minimum, maximum) => Math.floor((Math.random() * (maximum - minimum + 1)) + minimum);

const createAbortError = () => {
	const error = new Error('Delay aborted');
	error.name = 'AbortError';
	return error;
};

const createDelay = ({clearTimeout: defaultClear, setTimeout: set, willResolve}) => (ms, {value, signal} = {}) => {
	if (signal && signal.aborted) {
		return Promise.reject(createAbortError());
	}

	let timeoutId;
	let settle;
	let rejectFn;
	const clear = defaultClear || clearTimeout;

	const signalListener = () => {
		clear(timeoutId);
		rejectFn(createAbortError());
	};

	const cleanup = () => {
		if (signal) {
			signal.removeEventListener('abort', signalListener);
		}
	};

	const delayPromise = new Promise((resolve, reject) => {
		settle = () => {
			cleanup();
			if (willResolve) {
				resolve(value);
			} else {
				reject(value);
			}
		};

		rejectFn = reject;
		timeoutId = (set || setTimeout)(settle, ms);
	});

	if (signal) {
		signal.addEventListener('abort', signalListener, {once: true});
	}

	delayPromise.clear = () => {
		clear(timeoutId);
		timeoutId = null;
		settle();
	};

	return delayPromise;
};

const createWithTimers = clearAndSet => {
	const delay = createDelay({...clearAndSet, willResolve: true});
	delay.reject = createDelay({...clearAndSet, willResolve: false});
	delay.range = (minimum, maximum, options) => delay(randomInteger(minimum, maximum), options);
	return delay;
};

const delay = createWithTimers();
delay.createWithTimers = createWithTimers;

module.exports = delay;
// TODO: Remove this for the next major release
module.exports.default = delay;


/***/ }),

/***/ 57317:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "MultiArgsSplitRe": () => (/* binding */ MultiArgsSplitRe),
  "run": () => (/* binding */ run)
});

// EXTERNAL MODULE: ../node_modules/@actions/core/lib/core.js
var core = __webpack_require__(75316);
// EXTERNAL MODULE: ../node_modules/@sindresorhus/is/dist/index.js
var dist = __webpack_require__(4040);
var dist_default = /*#__PURE__*/__webpack_require__.n(dist);
// EXTERNAL MODULE: ../node_modules/chalk/source/index.js
var source = __webpack_require__(10816);
var source_default = /*#__PURE__*/__webpack_require__.n(source);
// EXTERNAL MODULE: ../node_modules/renovate/dist/datasource/index.js
var dist_datasource = __webpack_require__(184);
// EXTERNAL MODULE: ../node_modules/renovate/dist/versioning/index.js
var dist_versioning = __webpack_require__(11730);
// EXTERNAL MODULE: ./util.ts
var util = __webpack_require__(41838);
// EXTERNAL MODULE: ./utils/config.ts
var utils_config = __webpack_require__(21490);
// EXTERNAL MODULE: ../node_modules/delay/index.js
var delay = __webpack_require__(97390);
var delay_default = /*#__PURE__*/__webpack_require__.n(delay);
// EXTERNAL MODULE: ../node_modules/got/dist/source/index.js
var dist_source = __webpack_require__(4932);
var dist_source_default = /*#__PURE__*/__webpack_require__.n(dist_source);
// EXTERNAL MODULE: ../node_modules/www-authenticate/index.js
var www_authenticate = __webpack_require__(51318);
var www_authenticate_default = /*#__PURE__*/__webpack_require__.n(www_authenticate);
// EXTERNAL MODULE: ./utils/docker/common.ts
var common = __webpack_require__(43673);
// EXTERNAL MODULE: ./utils/logger.ts + 2 modules
var logger = __webpack_require__(33433);
// EXTERNAL MODULE: ./utils/types.ts
var types = __webpack_require__(17321);
;// CONCATENATED MODULE: ./utils/docker.ts








const registry = 'https://index.docker.io';
async function getAuthHeaders(registry, repository) {
    try {
        const apiCheckUrl = `${registry}/v2/`;
        const apiCheckResponse = await dist_source_default()(apiCheckUrl, { throwHttpErrors: false });
        if (apiCheckResponse.headers['www-authenticate'] === undefined) {
            return {};
        }
        const authenticateHeader = new (www_authenticate_default()).parsers.WWW_Authenticate(apiCheckResponse.headers['www-authenticate']);
        const authUrl = `${authenticateHeader.parms.realm}?service=${authenticateHeader.parms.service}&scope=repository:${repository}:pull`;
        const authResponse = (await dist_source_default()(authUrl, {
            responseType: 'json',
        })).body;
        const token = authResponse.token || authResponse.access_token;
        if (!token) {
            throw new Error('Failed to obtain docker registry token');
        }
        return {
            authorization: `Bearer ${token}`,
        };
    }
    catch (err) {
        logger/* default.error */.Z.error(source_default().red('auth error'), err.message);
        throw new Error('Failed to obtain docker registry token');
    }
}
var DockerContentType;
(function (DockerContentType) {
    DockerContentType["ManifestV1"] = "application/vnd.docker.distribution.manifest.v1+json";
    DockerContentType["ManifestV1Signed"] = "application/vnd.docker.distribution.manifest.v1+prettyjws";
    DockerContentType["ManifestV2"] = "application/vnd.docker.distribution.manifest.v2+json";
})(DockerContentType || (DockerContentType = {}));
const shaRe = /(sha256:[a-f0-9]{64})/;
async function getRemoteImageId(repository, tag = 'latest') {
    const headers = await getAuthHeaders(registry, repository);
    headers.accept = DockerContentType.ManifestV2;
    const url = `${registry}/v2/${repository}/manifests/${tag}`;
    try {
        const resp = await dist_source_default()(url, {
            headers,
            responseType: 'json',
        });
        switch (resp.headers['content-type']) {
            case DockerContentType.ManifestV2:
                return resp.body.config.digest;
            case DockerContentType.ManifestV1:
            case DockerContentType.ManifestV1Signed:
                // something wrong, we need to overwrite existing
                logger/* default.warn */.Z.warn(source_default().yellow('Wrong response'), `Wrong response: ${resp.headers['content-type']}`);
                return '<error>';
            default:
                throw new Error(`Unsupported response: ${resp.headers['content-type']}`);
        }
    }
    catch (e) {
        if (e instanceof dist_source.HTTPError && e.response.statusCode === 404) {
            // no image published yet
            return '<none>';
        }
        logger/* default.error */.Z.error(source_default().red('request error'), e.message);
        throw new Error('Could not find remote image id');
    }
}
async function getLocalImageId(image, tag = 'latest') {
    var _a;
    const res = await (0,common/* docker */.e$)('inspect', "--format='{{.Id}}'", `${image}:${tag}`);
    const [, id] = (_a = shaRe.exec(res.stdout)) !== null && _a !== void 0 ? _a : [];
    if (!id) {
        logger/* default.error */.Z.error(res);
        throw new Error('Could not find local image id');
    }
    return id;
}
const errors = [
    'unexpected status: 400 Bad Request',
    ': no response',
    'error writing layer blob',
];
function canRetry(err) {
    return errors.some((str) => err.stderr.includes(str));
}
async function build({ image, imagePrefix, cache, cacheTags, tag = 'latest', dryRun, buildArgs, }) {
    const args = [
        'buildx',
        'build',
        '--load',
        `--tag=${imagePrefix}/${image}:${tag}`,
    ];
    if (dist_default().nonEmptyArray(buildArgs)) {
        args.push(...buildArgs.map((b) => `--build-arg=${b}`));
    }
    if (dist_default().string(cache)) {
        const cacheImage = `${imagePrefix}/${cache}:${image.replace(/\//g, '-')}`;
        args.push(`--cache-from=${cacheImage}-${tag}`);
        if (dist_default().nonEmptyArray(cacheTags)) {
            for (const ctag of cacheTags) {
                args.push(`--cache-from=${cacheImage}-${ctag}`);
            }
        }
        if (!dryRun) {
            args.push(`--cache-to=type=registry,ref=${cacheImage}-${tag},mode=max`);
        }
    }
    for (let build = 0;; build++) {
        try {
            await (0,common/* docker */.e$)(...args, '.');
            break;
        }
        catch (e) {
            if (e instanceof types/* ExecError */.X && canRetry(e) && build < 2) {
                logger/* default.error */.Z.error(source_default().red(`docker build error on try ${build}`), e);
                await delay_default()(5000);
                continue;
            }
            throw e;
        }
    }
}
async function publish({ image, imagePrefix, tag, dryRun, }) {
    const imageName = `${imagePrefix}/${image}`;
    const fullName = `${imageName}:${tag}`;
    logger/* default.info */.Z.info(source_default().blue('Processing image:'), source_default().yellow(fullName));
    (0,logger/* default */.Z)('Fetch new id');
    const newId = await getLocalImageId(imageName, tag);
    (0,logger/* default */.Z)('Fetch old id');
    const oldId = await getRemoteImageId(imageName, tag);
    if (oldId === newId) {
        (0,logger/* default */.Z)('Image uptodate, no push nessessary:', source_default().yellow(oldId));
        return;
    }
    (0,logger/* default */.Z)('Publish new image', `${oldId} => ${newId}`);
    if (dryRun) {
        logger/* default.warn */.Z.warn(source_default().yellow('[DRY_RUN]'), source_default().blue('Would push:'), fullName);
    }
    else {
        await (0,common/* docker */.e$)('push', fullName);
    }
    logger/* default.info */.Z.info(source_default().blue('Processing image finished:', newId));
}

// EXTERNAL MODULE: ./utils/docker/buildx.ts
var buildx = __webpack_require__(14413);
;// CONCATENATED MODULE: ./utils/datasource/index.ts


function register() {
    (0,logger/* default */.Z)('register datasources');
    (0,dist_datasource.getDatasources)();
}

// EXTERNAL MODULE: ../node_modules/renovate/dist/versioning/semver/index.js
var semver = __webpack_require__(46559);
// EXTERNAL MODULE: ../node_modules/semver/index.js
var node_modules_semver = __webpack_require__(80931);
;// CONCATENATED MODULE: ./utils/versioning/node.ts


const id = 'node-lts';
const stableVersions = [12, 14];
const api = {
    ...semver.api,
    isStable: (v) => semver.api.isStable(v) && stableVersions.includes((0,node_modules_semver.major)(v)),
};
/* harmony default export */ const node = ((/* unused pure expression or super */ null && (api)));

// EXTERNAL MODULE: ../node_modules/renovate/dist/versioning/loose/generic.js
var generic = __webpack_require__(62737);
;// CONCATENATED MODULE: ./utils/versioning/ubuntu.ts

const versions = new Map([
    ['bionic', { release: [18, 4] }],
    ['18.04', { release: [18, 4] }],
    ['focal', { release: [20, 4] }],
    ['20.04', { release: [20, 4] }],
]);
const ubuntu_id = 'ubuntu';
function parse(version) {
    return versions.get(version);
}
function compare(version1, version2) {
    const parsed1 = parse(version1);
    const parsed2 = parse(version2);
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
function isCompatible(version, range) {
    const parsed1 = parse(version);
    const parsed2 = parse(range);
    return parsed1 != null && parsed2 != null;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const ubuntu_api = {
    ...generic.create({
        parse,
        compare,
    }),
    isCompatible,
};
/* harmony default export */ const ubuntu = ((/* unused pure expression or super */ null && (ubuntu_api)));

;// CONCATENATED MODULE: ./utils/versioning/index.ts




function versioning_register() {
    (0,logger/* default */.Z)('register versionings');
    const ds = (0,dist_versioning.getVersionings)();
    ds.set(id, api);
    ds.set(ubuntu_id, ubuntu_api);
}

;// CONCATENATED MODULE: ./utils/renovate.ts



function renovate_register() {
    (0,logger/* default */.Z)('register renovate extensions');
    register();
    versioning_register();
}

;// CONCATENATED MODULE: ./commands/docker/builder.ts












renovate_register();
const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;
let latestStable;
function getVersions(versions) {
    return {
        releases: versions.map((version) => ({
            version,
        })),
    };
}
async function getBuildList({ datasource, depName, versioning, startVersion, ignoredVersions, lastOnly, forceUnstable, versions, latestVersion, maxVersions, extractVersion, }) {
    var _a;
    (0,logger/* default */.Z)('Looking up versions');
    const ver = (0,dist_versioning.get)(versioning);
    const pkgResult = versions
        ? getVersions(versions)
        : await (0,dist_datasource.getPkgReleases)({
            datasource,
            depName,
            versioning,
            extractVersion,
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
        .filter((v) => v === startVersion || ver.isGreaterThan(v, startVersion))
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
    (0,logger/* default */.Z)('Latest stable version is', latestStable);
    if (latestStable && !allVersions.includes(latestStable)) {
        logger/* default.warn */.Z.warn(`LatestStable '${latestStable}' not buildable, candidates:`, allVersions.join(', '));
    }
    const lastVersion = allVersions[allVersions.length - 1];
    (0,logger/* default */.Z)('Most recent version is', lastVersion);
    if (dist_default().number(maxVersions) && maxVersions > 0) {
        (0,logger/* default */.Z)(`Building last ${maxVersions} version only`);
        allVersions = allVersions.slice(-maxVersions);
    }
    if (lastOnly) {
        (0,logger/* default */.Z)('Building last version only');
        allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
    }
    if (allVersions.length) {
        (0,logger/* default */.Z)('Build list:', allVersions.join(', '));
    }
    else {
        (0,logger/* default */.Z)('Nothing to build');
    }
    return allVersions;
}
function createTag(tagSuffix, version) {
    return dist_default().nonEmptyString(tagSuffix) && tagSuffix !== 'latest'
        ? `${version}-${tagSuffix}`
        : version;
}
async function buildAndPush({ imagePrefix, image, buildArg, buildArgs, buildOnly, cache, dryRun, tagSuffix, versioning, majorMinor, prune, }, versions) {
    const builds = [];
    const failed = [];
    const ver = (0,dist_versioning.get)(versioning || 'semver');
    const versionsMap = new Map();
    if (majorMinor) {
        for (const version of versions) {
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
    await (0,util/* exec */.GL)('df', ['-h']);
    for (const version of versions) {
        const tag = createTag(tagSuffix, version);
        const imageVersion = `${imagePrefix}/${image}:${tag}`;
        (0,logger/* default */.Z)(`Building ${imageVersion}`);
        try {
            const minor = ver.getMinor(version);
            const major = ver.getMajor(version);
            const cacheTags = [tagSuffix !== null && tagSuffix !== void 0 ? tagSuffix : 'latest'];
            const tags = [];
            if (dist_default().number(major) &&
                majorMinor &&
                versionsMap.get(`${major}`) === version) {
                const nTag = createTag(tagSuffix, `${major}`);
                cacheTags.push(nTag);
                tags.push(nTag);
            }
            if (dist_default().number(major) &&
                dist_default().number(minor) &&
                majorMinor &&
                versionsMap.get(`${major}.${minor}`) === version) {
                const nTag = createTag(tagSuffix, `${major}.${minor}`);
                cacheTags.push(nTag);
                tags.push(nTag);
            }
            if (version === latestStable) {
                tags.push(tagSuffix !== null && tagSuffix !== void 0 ? tagSuffix : 'latest');
            }
            await build({
                image,
                imagePrefix,
                tag,
                cache,
                cacheTags,
                buildArgs: [...(buildArgs !== null && buildArgs !== void 0 ? buildArgs : []), `${buildArg}=${version}`],
                dryRun,
            });
            if (!buildOnly) {
                await publish({ image, imagePrefix, tag, dryRun });
                const source = tag;
                for (const tag of tags) {
                    (0,logger/* default */.Z)(`Publish ${source} as ${tag}`);
                    await (0,common/* dockerTag */.zJ)({ image, imagePrefix, src: source, tgt: tag });
                    await publish({ image, imagePrefix, tag, dryRun });
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
        await (0,util/* exec */.GL)('df', ['-h']);
        if (prune) {
            await (0,common/* dockerPrune */.py)();
            await (0,util/* exec */.GL)('df', ['-h']);
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
    const buildList = await getBuildList(config);
    if (buildList.length === 0) {
        (0,core.setFailed)(`No versions found.`);
        return;
    }
    await buildAndPush(config, buildList);
}
async function run() {
    var _a, _b, _c;
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
        imagePrefix: ((_a = (0,util/* getArg */.a8)('image-prefix')) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, '')) || 'renovate',
        image: cfg.image,
        depName: (_b = cfg.depName) !== null && _b !== void 0 ? _b : cfg.image,
        buildArg: cfg.buildArg,
        buildArgs: (0,util/* getArg */.a8)('build-args', { multi: true }),
        tagSuffix: (0,util/* getArg */.a8)('tag-suffix') || undefined,
        ignoredVersions: (_c = cfg.ignoredVersions) !== null && _c !== void 0 ? _c : [],
        dryRun,
        lastOnly: (0,core.getInput)('last-only') == 'true',
        buildOnly: (0,core.getInput)('build-only') == 'true',
        majorMinor: (0,util/* getArg */.a8)('major-minor') !== 'false',
        prune: (0,util/* getArg */.a8)('prune') === 'true',
    };
    if (dryRun) {
        (0,logger/* default */.Z)('GitHub Actions branch detected - Force building latest, no push');
        config.lastOnly = true;
    }
    (0,logger/* default */.Z)('config:', JSON.stringify(config));
    await (0,buildx/* init */.S)();
    await generateImages(config);
    logger/* default.info */.Z.info(source_default().blue('Processing done:', config.image));
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
        _pkg = find_up__WEBPACK_IMPORTED_MODULE_4___default()('package.json', { cwd: __dirname, type: 'file' });
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
//# sourceMappingURL=317.index.js.map