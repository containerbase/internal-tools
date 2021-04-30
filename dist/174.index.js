exports.id = 174;
exports.ids = [174];
exports.modules = {

/***/ 28174:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "run": () => (/* binding */ run)
/* harmony export */ });
/* harmony import */ var _utils_docker_buildx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14413);

async function run() {
    await (0,_utils_docker_buildx__WEBPACK_IMPORTED_MODULE_0__/* .init */ .S)();
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
//# sourceMappingURL=174.index.js.map