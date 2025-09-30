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
      
    // Tipo de respuesta (code flow con PKCE es lo recomendado)
    responseType: 'code',

    // Alcance (scopes) solicitados
    scope: 'openid profile email offline_access',

    // Solo HTTPS en producción
    requireHttps: environment.production,  
    
    // Deshabilitar validación de issuer en modo desarrollo si es necesario
    strictDiscoveryDocumentValidation: false,
    
    // Usar PKCE (Proof Key for Code Exchange) - recomendado para SPAs
    useSilentRefresh: true,
        
    // URL para silent refresh
    silentRefreshRedirectUri: origin + '/silent-refresh.html',
    
    // Tiempo de espera para silent refresh
    silentRefreshTimeout: 5000,

    // Refresh al 75% del tiempo de vida del token
    //timeoutFactor: 0.75,  
       
    // Show debug info
    showDebugInformation: !environment.production,
    
    // Session checks
    sessionChecksEnabled: true,  
    sessionCheckIntervall: 5000,
    
    clearHashAfterLogin: false,
    nonceStateSeparator: 'semicolon',

    // Configuración para que persista la sesión
    disableAtHashCheck: true
    
  };
}
