export const environment = {
  production: false,
  staging: false,
  locale: 'es-AR',
  cmDomain: 'tubarrio.com.ar',
  apiUrl: 'https://s.jatic.com.ar/api', 
  cdnUrl: 'https://cdn.jatic.com.ar',
  auth: {
    issuer: 'https://a.jatic.com.ar',
    clientId: 'junto-a-tic-api',
    realm: 'junto-a-tic',
    scope: 'openid profile email'
  },
  googleAnalyticsId: '',
  enableDevTools: true,
  cacheTimeout: 5 * 60 * 1000,
  logLevel: 'debug',
  features: {
    enablePWA: false,
    enableServiceWorker: false,
    enableCaching: false
  }
};