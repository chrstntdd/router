# router

![Size](https://badgen.net/bundlephobia/minzip/@chrstntdd/router@latest)

Just a router for react

**WARNING** 🏗 This router is in active development and is not fully tested or documented...yet 🚧

## Features

* 🛠 Hooks and functions all the way down — no ES6 classes to be found
* 🌳 Tree-shakable (ESM w/ no side effects)
* 🚫 0 dependencies
* 🐜 Tiny footprint
* 🚟 Suspense aware
* 📘 TypeScript friendly

## Prior Art / Credit
This router began as a fork of [@reach/router](https://github.com/reach/router) so the API is about the same.


## Installation

With npm
```bash
$ npm install @chrstntdd/router
```
With yarn
```bash
$ yarn add @chrstntdd/router
```

## Considerations

The published code is all valid ES5; however, internally it does depend on [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame). If your [environment](https://caniuse.com/#feat=requestanimationframe) does not support this browser API, then you will have to polyfill it yourself.
