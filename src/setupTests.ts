import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder to the global scope for JSDOM
// Using the browser's TextEncoder/TextDecoder instead of Node's util module
// These are already available in the global scope in modern browsers and jsdom

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
