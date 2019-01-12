# router

![Size](https://badgen.net/bundlephobia/minzip/@chrstntdd/router@latest)

Just a router for react

**WARNING** 🏗 This router is in active development and is not fully tested or documented...yet 🚧

## Features

- 🛠 Hooks and functions all the way down — no ES6 classes to be found
- 🌳 Tree-shakable (ESM w/ no side effects)
- 🚫 0 dependencies
- 🐜 Tiny footprint
- 🚟 Suspense aware
- 📘 TypeScript friendly

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

The published code depends on `Object.assign()` [support](http://kangax.github.io/compat-table/es6/#test-Object_static_methods_Object.assign) and [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame). If your environment does not support these browser features, then you must provide your own polyfills.

> React ships with an `Object.assign()` polyfill. [source](https://github.com/facebook/react/blob/master/packages/react-dom/package.json#L17)
