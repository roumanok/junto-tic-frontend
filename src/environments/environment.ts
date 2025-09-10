export const environment = {
  production: false,
  staging: false,
  apiUrl: '/api', 
  cdnUrl: 'https://cdn.jatic.com.ar',
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