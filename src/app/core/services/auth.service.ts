// src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { OAuthService, AuthConfig, OAuthEvent } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import { getAuthConfig } from '../config/auth.config';

interface UserProfile {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();
  
  private userProfileSubject$ = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject$.asObservable();

  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject$.asObservable();

  constructor() {
    // Solo inicializar OAuth en el browser
    if (isPlatformBrowser(this.platformId)) {
      this.initOAuth();
    }else {            
      this.isLoadingSubject$.next(false);      
    }
  }

  private initOAuth(): void {
    // Configurar OAuth
    this.oauthService.configure(getAuthConfig());

    this.oauthService.setStorage(sessionStorage);    

    this.isLoadingSubject$.next(true);
    
    // Cargar discovery document (endpoints de Keycloak)
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {     
      this.oauthService.setupAutomaticSilentRefresh();    

      console.log('OAuth configuration loaded, updating auth state...');
      this.updateAuthenticationState();

      this.loadUserProfile();              
      this.isLoadingSubject$.next(false);      
    })
    .catch((error) => {
      console.error('Error al cargar OAuth:', error);        
      this.isLoadingSubject$.next(false);
    });

    // Suscribirse a eventos de OAuth
    this.oauthService.events
      .pipe(filter(e => ['token_received', 'token_refreshed', 'token_expires'].includes(e.type)))
      .subscribe((event: OAuthEvent) => {      
        console.log('🔄 OAuth Event:', event.type);  
        this.updateAuthenticationState();
        this.loadUserProfile();
      });

    this.oauthService.events
      .pipe(filter(e => e.type === 'silent_refresh_error'))
      .subscribe(() => {
        console.warn('⚠️ Error en silent refresh, redirigiendo al login');
        this.oauthService.initLoginFlow();
      });
    

    this.oauthService.events
      .pipe(filter(e => e.type === 'logout'))
      .subscribe(() => {
        this.isAuthenticatedSubject$.next(false);
        this.userProfileSubject$.next(null);
      });

  }

  /**
   * Verifica si está cargando el estado de autenticación
   */
  isLoading(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;    
    return this.isLoadingSubject$.value;
  }

  /**
   * Redirige al usuario a la página de login de Keycloak
   */
  login(targetUrl?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (targetUrl) {
      this.oauthService.initCodeFlow(targetUrl);
    } else {
      this.oauthService.initCodeFlow();
    }
  }

  /**
   * Redirige al usuario a la página de registro de Keycloak
   */
  register(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const authConfig = getAuthConfig();
    const registerUrl = `${authConfig.issuer}/protocol/openid-connect/registrations?client_id=${authConfig.clientId}&redirect_uri=${authConfig.redirectUri}&response_type=code&scope=openid`;
    window.location.href = registerUrl;
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.oauthService.logOut();
    this.isAuthenticatedSubject$.next(false);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    return this.oauthService.hasValidAccessToken();
  }

  /**
   * Obtiene el token de acceso
   */
  getAccessToken(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    
    return this.oauthService.getAccessToken();
  }

  /**
   * Obtiene el token de identidad
   */
  getIdToken(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    
    return this.oauthService.getIdToken();
  }

  /**
   * Obtiene el perfil del usuario desde el ID token
   */
  getUserProfile(): UserProfile | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    const claims = this.oauthService.getIdentityClaims() as UserProfile;
    return claims || null;
  }

  /**
   * Obtiene el nombre del usuario
   */
  getUsername(): string {
    if (!isPlatformBrowser(this.platformId)) return 'Usuario';
    
    const profile = this.getUserProfile();
    return profile?.given_name || 
           profile?.name || 
           profile?.preferred_username ||
           profile?.email || 
           'Usuario';
  }

  /**
   * Carga el perfil del usuario
   */
  private loadUserProfile(): void {
    const profile = this.getUserProfile();
    this.userProfileSubject$.next(profile);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    const claims = this.oauthService.getIdentityClaims() as any;
    const roles = claims?.realm_access?.roles || claims?.roles || [];
    return roles.includes(role);
  }

  /**
   * Obtiene todos los roles del usuario
   */
  getUserRoles(): string[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    
    const claims = this.oauthService.getIdentityClaims() as any;
    return claims?.realm_access?.roles || claims?.roles || [];
  }

  /**
   * Refresca el token
   */
  async refreshToken(): Promise<boolean> {
    try {
      await this.oauthService.silentRefresh();
      this.updateAuthenticationState();
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    const isAuth = this.oauthService.hasValidAccessToken();
    console.log('🔍 AuthService.isAuthenticated():', {
      hasValidAccessToken: isAuth,
      accessToken: this.oauthService.getAccessToken() ? 'exists' : 'missing'
    });
    return isAuth;
  }

  updateAuthenticationState(): void {
    const isAuth = this.isAuthenticated();
    this.isAuthenticatedSubject$.next(isAuth);
    console.log('Estado de autenticación actualizado:', isAuth);
  }

}