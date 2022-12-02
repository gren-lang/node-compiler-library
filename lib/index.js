import { xdgCache } from 'xdg-basedir'
import * as path from 'path'
import * as fs from 'fs/promises'
import { default as followRedirects } from 'follow-redirects'
import * as os from 'os'

const https = followRedirects.https;

const version = '0.2.0';
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
    return `https://github.com/gren-lang/compiler/releases/download/v${version}/${fileName}`;
}

export const compilerPath = path.join(
    xdgCache,
    'gren',
    version,
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

    console.log(`Gren ${version} is not installed, downloading...`);

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
