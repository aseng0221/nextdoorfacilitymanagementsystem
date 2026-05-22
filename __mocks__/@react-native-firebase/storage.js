export default () => ({
  ref: jest.fn(() => ({
    putFile: jest.fn(() => Promise.resolve()),
    getDownloadURL: jest.fn(() => Promise.resolve('https://dummy-url.com/receipt.png')),
  })),
});