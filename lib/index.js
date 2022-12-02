import { xdgCache } from 'xdg-basedir'
import * as path from 'path'
import * as fs from 'fs/promises'
import { default as followRedirects } from 'follow-redirects'
import * as os from 'os'
import * as childProcess from "child_process";

const https = followRedirects.https;

const execFile = util.promisify(childProcess.execFile);

// SETUP

export const compilerVersion = '0.2.0';
const platform = os.platform();

let compilerExtension = '';
let downloadUrl = '';

switch (platform) {
    case 'linux':
        downloadUrl = constructDownloadPath('gren_linux');
        break;
    case 'darwin':
        downloadUrl = constructDownloadPath('gren_mac');
        break;
    case 'win32':
        downloadUrl = constructDownloadPath('gren.exe');
        compilerExtension = '.exe';
        break;
    default:
        throw new Error(`This package doesn't support the ${platform} platform`);
}

function constructDownloadPath(fileName) {
    return `https://github.com/gren-lang/compiler/releases/download/v${compilerVersion}/${fileName}`;
}

export const compilerPath = path.join(
    xdgCache,
    'gren',
    compilerVersion,
    'bin',
    `gren${compilerExtension}`
);

// If not already downloaded, download the correct Gren compiler
export async function downloadCompiler() {
    let isCached;
    try {
        await fs.stat(compilerPath);
        isCached = true;
    } catch (err) {
        isCached = false;
        // make sure bin folder exists
        const binPath = path.dirname(compilerPath);
        await fs.mkdir(binPath, { recursive: true });
    }

    if (isCached) {
        return;
    }

    console.log(`Gren ${compilerVersion} is not installed, downloading...`);

    const download = new Promise((resolve, reject) => {
        https.get(downloadUrl, (res) => {
            fs.open(compilerPath, 'wx', 755).then((handle) => {
                const filePath = handle.createWriteStream(compilerPath);

                res.pipe(filePath);

                filePath.on('error', (err) => {
                    reject(err);
                });

                res.on('error', (err) => {
                    reject(err);
                });

                filePath.on('finish', () => {
                    filePath.close();
                    resolve();
                });
            }).catch(err => {
                reject(err);
            });
        })
    });

    await download;

    console.log('Done!');
}

// COMMANDS

export async function execute(path, args, options) {
    return await execFile(compilerPath, args, {
      cwd: path,
      env: options.env || {},
      timeout: options.timeout || 30_000,
    });
}

export async function installDependencies(path, options) {
    await execute(path, ['package', 'install'], options || {});
    return true;
}

export async function compileProject(path, options) {
    let args = ['make', '--output=/dev/stdout', '--report=json'];
    if (options.target) {
        args.push(options.target);
    }

    return handleFailableExecution(path, args, options);
}

async function handleFailableExecution(path, args, options) {
    try {
        const res = await execute(path, args, options);
        return res.stdout;
    } catch (e) {
        let errorData;
        try {
            errorData = JSON.parse(e.stderr);
        } catch (parseErr) {
            // Didn't get error from compiler
            throw e;
        }

        const compileError = new Error(`Failed to compile project: ${path}`);
        for (let key in errorData) {
            compileError[key] = errorData[key];
        }

        throw compileError;
    }
}

export async function compileDocs(path, options) {
    let args = ['docs', '--output=/dev/stdout', '--report=json'];
    const docs = await handleFailableExecution(path, args, options || {});

    return JSON.parse(docs);
}

export async function validateFormatting(path, options) {
    let args = ['format', '--validate'];
    await handleFailableExecution(path, args, options || {});
    return true;
}

export async function validateProject(path, opts) {
    let options = opts || {};
    let args;

    if (options.target) {
        args = ['make', '--output=/dev/null', '--report=json', options.target];
    } else {
        args = ['docs', '--output=/dev/null', '--report=json'];
    }

    await handleFailableExecution(path, args, options);

    return true;
}

