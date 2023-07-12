"use strict";
exports.id = 855;
exports.ids = [855];
exports.modules = {

/***/ 51855:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "run": () => (/* binding */ run)
/* harmony export */ });
/* harmony import */ var _utils_docker_buildx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(96664);

async function run() {
    await (0,_utils_docker_buildx__WEBPACK_IMPORTED_MODULE_0__/* .init */ .S)(true);
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
/* harmony import */ var _actions_io__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(66402);
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
//# sourceMappingURL=855.index.js.map