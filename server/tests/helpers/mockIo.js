// tests/helpers/mockIo.js — Socket.io mock 객체

function createMockIo() {
  const emitted = [];

  const toReturn = {
    emit: jest.fn((event, data) => {
      emitted.push({ event, data });
    }),
    fetchSockets: jest.fn().mockResolvedValue([]),
  };

  const mockIo = {
    to: jest.fn().mockReturnValue(toReturn),
    in: jest.fn().mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([]) }),
    sockets: { sockets: new Map() },
    emitted,
    getEmissions(event) {
      return emitted.filter((e) => e.event === event);
    },
    reset() {
      emitted.length = 0;
      mockIo.to.mockClear();
      toReturn.emit.mockClear();
    },
  };

  return mockIo;
}

function createMockSocket(userId, overrides = {}) {
  const emitted = [];
  return {
    id: `socket_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    request: {
      session: { passport: { user: userId } },
    },
    emit: jest.fn((event, data) => {
      emitted.push({ event, data });
    }),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    emitted,
    getLastEmission(event) {
      return emitted.filter((e) => e.event === event).pop();
    },
    ...overrides,
  };
}

module.exports = { createMockIo, createMockSocket };
