const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'ticket',

  exposes: {
    './routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
    '@angular/common': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      includeSecondaries: true,
    },
    '@angular/common/locales/vi': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },
    'dynamic-ds': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto',
      includeSecondaries: true,
    },
    'ng-zorro-antd': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto',
      includeSecondaries: true,
    },
  },
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
  features: {
    ignoreUnusedDeps: true,
  },
});