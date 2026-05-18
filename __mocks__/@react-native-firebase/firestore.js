module.exports = () => ({
  FieldValue: {
    increment: jest.fn((val) => val)
  },
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      get: jest.fn(() => Promise.resolve({ data: () => ({}) })),
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] }))
      }))
    })),
    get: jest.fn(() => Promise.resolve({ docs: [] })),
    limit: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ empty: true, docs: [] }))
    }))
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  }))
});
