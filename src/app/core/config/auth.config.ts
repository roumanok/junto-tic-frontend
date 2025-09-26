import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export function getAuthConfig(): AuthConfig {
  // Valores por defecto para SSR
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
  
  return {
    // URL del servidor de identidad (tu backend que maneja Keycloak)
    issuer: `${environment.auth.issuer}/realms/${environment.auth.realm}`,
    
    // URL a la que redirigir después del login
    redirectUri: origin + '/auth/callback',
    
    // URL a la que redirigir después del logout
    postLogoutRedirectUri: origin,
    
    // ID del cliente configurado en Keycloak
    clientId: environment.auth.clientId,
    
    // Alcance (scopes) solicitados
    scope: 'openid profile email',

    requireHttps: environment.production,  // Solo HTTPS en producción
    
    // Tipo de respuesta (code flow con PKCE es lo recomendado)
    responseType: 'code',
    
    // Deshabilitar validación de issuer en modo desarrollo si es necesario
    strictDiscoveryDocumentValidation: false,
    
    // Usar PKCE (Proof Key for Code Exchange) - recomendado para SPAs
    useSilentRefresh: true,
    
    // URL para silent refresh
    silentRefreshRedirectUri: origin + '/silent-refresh.html',
    
    // Tiempo de espera para silent refresh
    silentRefreshTimeout: 5000,
    
    // Timeout para obtener el token
    timeoutFactor: 0.75,
    
    // Session checks
    sessionChecksEnabled: true,
    
    // Show debug info
    showDebugInformation: !environment.production,
    
    // Clear hash after login
    clearHashAfterLogin: false,

    nonceStateSeparator: 'semicolon',

    // Configuración para que persista la sesión
    disableAtHashCheck: true
    
    // Configuración de endpoints personalizados (si tu backend tiene rutas custom)
    // Si no tienes discovery document, descomentá y configurá manualmente:
    // loginUrl: 'https://s.jatic.com.ar/auth/login',
    // tokenEndpoint: 'https://s.jatic.com.ar/auth/token',
    // userinfoEndpoint: 'https://s.jatic.com.ar/auth/userinfo',
    // logoutUrl: 'https://s.jatic.com.ar/auth/logout',
    // revocationEndpoint: 'https://s.jatic.com.ar/auth/revoke',
  };
}
