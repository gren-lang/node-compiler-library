# Gren installer

Gren is a pure functional programming language that compiles to JavaScript.

Read more about Gren on [gren-lang.org](https://gren-lang.org).

## Why use this package?

This package makes it easy to install a specific version of the Gren compiler using npm. It's a handy way to install the compiler when you already have npm available.

Of course, you don't _have to_ install Gren this way. The Gren website lists [alternative setup instructions](https://gren-lang.org/install) if you'd rather not use npm.

## How it works

The first time you execute `gren` after installing it with this package, it will download the correct binary for your operating system from github. This binary will be placed in `$XDG_CACHE_DIR/gren/$version/bin/gren`. All arguments will then be passed on to this cached compiler binary.

If you're running this in a CI setup, caching the `$XDG_CACHE_DIR/gren` folder will cache both the compiler and the project dependencies, which is recommended.
