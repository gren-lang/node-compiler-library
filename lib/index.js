import { xdgCache } from "xdg-basedir";
import * as path from "path";
import * as fs from "fs/promises";
import { default as followRedirects } from "follow-redirects";
import * as os from "os";
import * as childProcess from "child_process";
import * as util from "util";

const https = followRedirects.https;

const execFile = util.promisify(childProcess.execFile);

// SETUP

/* The version of the Gren compiler that will be downloaded and used for the commands in this package */
export const compilerVersion = "0.2.0";

const platform = os.platform();

let compilerExtension = "";
let downloadUrl = "";

switch (platform) {
  case "linux":
    downloadUrl = constructDownloadPath("gren_linux");
    break;
  case "darwin":
    downloadUrl = constructDownloadPath("gren_mac");
    break;
  case "win32":
    downloadUrl = constructDownloadPath("gren.exe");
    compilerExtension = ".exe";
    break;
  default:
    throw new Error(`This package doesn't support the ${platform} platform`);
}

function constructDownloadPath(fileName) {
  return `https://github.com/gren-lang/compiler/releases/download/${compilerVersion}/${fileName}`;
}

/* The path where we expect to find the Gren compiler */
export const compilerPath = path.join(
  xdgCache,
  "gren",
  compilerVersion,
  "bin",
  `gren${compilerExtension}`
);

/* Download the compiler to `compilerPath`, if it doesn't already exist. */
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
      fs.open(compilerPath, "wx", 755)
        .then((handle) => {
          const filePath = handle.createWriteStream(compilerPath);

          res.pipe(filePath);

          filePath.on("error", (err) => {
            reject(err);
          });

          res.on("error", (err) => {
            reject(err);
          });

          filePath.on("finish", () => {
            filePath.close();
            resolve();
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  });

  await download;

  console.log("Done!");
}

// COMMANDS

/* Execute an arbitrary command on the Gren compiler.
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `args` is an array of arguments passed to the gren compiler.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function execute(path, args, options) {
  return await execFile(compilerPath, args, {
    cwd: path,
    env: options.env || {},
    timeout: options.timeout || 30_000,
  });
}

/* Install the dependencies of a Gren project.
 *
 * This executes `gren package install`
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function installDependencies(path, options) {
  await execute(path, ["package", "install"], options || {});
  return true;
}

/* Compile a Gren project.
 *
 * This executes `gren make` and returns the compiled output, or throws an exception.
 * If you're compiling an application, pass the relative path of the entrypoint as the `target` in the options object.
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function compileProject(path, options) {
  let args = ["make", "--output=/dev/stdout", "--report=json"];
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

/* Compile the documentation of a Gren project.
 *
 * This executes `gren docs` and returns the documentation object, or throws an exception.
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function compileDocs(path, options) {
  let args = ["docs", "--output=/dev/stdout", "--report=json"];
  const docs = await handleFailableExecution(path, args, options || {});

  return JSON.parse(docs);
}

/* Checks if a Gren project has been formatted with `gren format`.
 *
 * This executes `gren format --validate`, and returns the result as a boolean.
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function validateFormatting(path, options) {
  let args = ["format", "--validate"];
  await handleFailableExecution(path, args, options || {});
  return true;
}

/* Checks that a Gren project compiles, and (for packages) that the documentation builds.
 *
 * This executes `gren make` or `gren docs` (for packages), and returns true if the project compiles successfully.
 * If you're compiling an application, pass the relative path of the entrypoint as the `target` in the options object.
 *
 * `path` should be set to the project directory where you wish to execute this command.
 * `options` allow you to set environment variables and a timeout (milliseconds).
 */
export async function validateProject(path, opts) {
  let options = opts || {};
  let args;

  if (options.target) {
    args = ["make", "--output=/dev/null", "--report=json", options.target];
  } else {
    args = ["docs", "--output=/dev/null", "--report=json"];
  }

  await handleFailableExecution(path, args, options);

  return true;
}
