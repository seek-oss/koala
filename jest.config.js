module.exports = {
  ...require('skuba/config/jest'),

  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
    },
  },
};
