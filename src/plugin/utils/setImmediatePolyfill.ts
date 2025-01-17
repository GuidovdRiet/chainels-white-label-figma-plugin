export {};

// Define the global type
declare global {
  interface Window {
    setImmediate: {
      (callback: (...args: any[]) => void, ...args: any[]): number;
      __promisify__: () => Promise<void>;
    };
  }
}

// Create the function with the required __promisify__ property
const setImmediateWithPromisify = Object.assign(
  function setImmediate(
    callback: (...args: any[]) => void,
    ...args: any[]
  ): number {
    return setTimeout(() => callback(...args), 0);
  },
  { __promisify__: () => Promise.resolve() }
);

// Polyfill for setImmediate
if (typeof window !== "undefined" && !window.setImmediate) {
  window.setImmediate = setImmediateWithPromisify;
}
