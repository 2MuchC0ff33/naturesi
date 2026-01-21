module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:8080/index.html',
        'http://127.0.0.1:8080/pages/store/wellness-blends.html',
        'http://127.0.0.1:8080/pages/checkout.html',
      ],
      startServerCommand: 'npm run start:static',
      startServerReadyPattern: 'Available on',
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
