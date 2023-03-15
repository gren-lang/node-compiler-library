# gren-compiler-library

This package makes it easy to communicate with the Gren compiler from JavaScript.

This library is compatible with Gren 0.2.1.

## API

You can find more details in the documentation comments in the source code, but here's a short overview.

- `compilerVersion`: The version of the Gren compiler this package supports.
- `compilerPath`: A string containing the actual location to where the Gren compiler will be installed.
- `downloadCompiler()`: Download the Gren compiler, if it doesn't already exist at `compilerPath`.
- `execute(path, args, options)`: Execute any command through the Gren compiler.
- `installDependencies(path, options)`: Install all dependencies of project on `path`.
- `compileProject(path, options)`: Compile the project on `path`.
- `compileDocs(path, options)`: Extract documentation from project on `path`.
- `validateFormatting(path, options)`: Check that project on `path` is compiled with `gren format`.
- `validateProject(path, options)`: Check that project on `path` compiles successfully.
