var sessionStorageMock = (function() {
  var store = {};

  return {
    getItem: jest.fn(key => {
      return store[key] || null;
    }),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = jest.fn();
    this.addEventListener = jest.fn((msg, fn) => {});
    this.postMessage = jest.fn(msg => {});
    this.terminate = jest.fn();
  }
}

class TextEncoder {
  constructor() {
    this.encode = jest.fn();
  }
}

window.Worker = Worker;
window.TextEncoder = TextEncoder;
