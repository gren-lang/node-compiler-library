# node-compiler-library

This package makes it easy to communicate with the Gren compiler from JavaScript.

This library is compatible with Gren 0.4.5.

## API

You can find more details in the documentation comments in the source code, but here's a short overview.

- `execute(path, args, options)`: Execute any command through the Gren compiler.
- `installDependencies(path, options)`: Install all dependencies of project on `path`.
- `compileProject(path, options)`: Compile the project on `path`.
- `compileDocs(path, options)`: Extract documentation from project on `path`.
- `validateProject(path, options)`: Check that project on `path` compiles successfully.
