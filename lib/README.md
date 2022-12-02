# gren-compiler-library

This package makes it easy to communicate with the Gren compiler from JavaScript.

This library is compatible with Gren v0.1.0.

Currently not a whole lot going on in this package. Expect it to gradually improve over time.

## API

- `compilerPath`: A string containing the actual location to where the Gren compiler will be installed.
- `downloadCompiler()`: Download the Gren compiler, if it doesn't already exist at `compilerPath`.
