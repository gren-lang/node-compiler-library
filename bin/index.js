#!/usr/bin/env node

import * as gren from 'gren-compiler-library'
import * as childProcess from 'child_process'
import * as process from 'process'
import * as util from 'util'

async function run() {
    try {
        await gren.downloadCompiler();
        
        const args = process.argv.slice(2);
        const compiler = childProcess.spawn(gren.compilerPath, args, {
            stdio: 'inherit'
        });
        
        compiler.on('exit', (code) => process.exit(code));
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
