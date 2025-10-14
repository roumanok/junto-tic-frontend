// src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { OAuthService, AuthConfig, OAuthEvent } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable, filter, map , firstValueFrom } from 'rxjs';
import { getAuthConfig } from '../config/auth.config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserMeResponse, UserProfile } from '../models/user.model';
import { CommunityService } from './community.service';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private snackBar = inject(MatSnackBar);  
  private communityService = inject(CommunityService);
  private apiService = inject(ApiService);
  
  private isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();
  
  private userProfileSubject$ = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject$.asObservable();

  private isLoadingSubject$ = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject$.asObservable();

  private communityRolesSubject$ = new BehaviorSubject<string[]>([]);
  public communityRoles$ = this.communityRolesSubject$.asObservable();

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
    this.oauthService.setStorage(localStorage);    
    this.isLoadingSubject$.next(true);

    if (isPlatformBrowser(this.platformId)) {
    window.addEventListener('message', (event) => {
      console.log('📨 [AUTH-SERVICE] Mensaje recibido:', {
        origin: event.origin,
        data: event.data,
        source: event.source
      });
    });
  }
    
    // Cargar discovery document (endpoints de Keycloak)
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(async () => {     
      console.log('✅ Discovery document cargado');
      console.log('🔍 Endpoints:', this.oauthService);
      this.oauthService.setupAutomaticSilentRefresh();          
      console.log('✅ Silent refresh configurado');
      this.updateAuthenticationState();
      this.loadUserProfile();              
      if (this.isLoggedIn()) {
        await this.loadUserFromApi();
      }
      this.isLoadingSubject$.next(false);            
    })
    .catch((error) => {
      console.error('❌ Error al cargar OAuth:', error);
      this.isLoadingSubject$.next(false);
    });

    /*
    // ✅ Escuchar TODOS los eventos OAuth para debugging
    this.oauthService.events.subscribe((event: OAuthEvent) => {
      console.log('🔔 OAuth Event:', event.type, event);
      
      if (event.type === 'token_refresh_error' || event.type === 'silent_refresh_error') {
        console.error('💥 Error en refresh:', event);
      }
    });
    */
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
        this.communityRolesSubject$.next([]);
      });

  }

  /**
   * Carga los datos del usuario desde /api/auth/me
   */
  async loadUserFromApi(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const communityId = this.communityService.communityId;
    if (!communityId) {
      console.warn('⚠️ No se puede cargar usuario: communityId no disponible');
      return;
    }

    try {
      const params = new HttpParams().set('community_id', communityId);
      
      const userData = await firstValueFrom(
        this.apiService.getSimple<UserMeResponse>('/auth/me', params)
      );
      
      console.log('✅ Datos del usuario cargados desde API:', userData);
      
      this.communityRolesSubject$.next(userData.roles || []);
      
      const currentProfile = this.userProfileSubject$.value;
      if (currentProfile) {
        this.userProfileSubject$.next({
          ...currentProfile,
          communityRoles: userData.roles
        });
      }
      
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
    }
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
    
    const urlToReturn = targetUrl || this.router.url;
        
    if (urlToReturn && urlToReturn !== '/login' && urlToReturn !== '/login-required') {
      sessionStorage.setItem('auth_redirect_url', urlToReturn);
    }
    
    this.oauthService.initCodeFlow(urlToReturn);
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
    this.communityRolesSubject$.next([]);
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
   * Verifica si el usuario tiene un rol específico en la comunidad
   */
  hasRole(role: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    // Primero intentar con los roles de la comunidad (desde API)
    const communityRoles = this.communityRolesSubject$.value;
    if (communityRoles.length > 0) {
      return communityRoles.includes(role);
    }
    
    // Fallback a los roles del token (para compatibilidad)
    const claims = this.oauthService.getIdentityClaims() as any;
    const tokenRoles = claims?.realm_access?.roles || claims?.roles || [];
    return tokenRoles.includes(role);
  }

  /**
   * Obtiene todos los roles del usuario en la comunidad
   */
  getUserRoles(): string[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    
    // Primero intentar con los roles de la comunidad (desde API)
    const communityRoles = this.communityRolesSubject$.value;
    if (communityRoles.length > 0) {
      return communityRoles;
    }
    
    // Fallback a los roles del token (para compatibilidad)
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

  checkAdvertiserAccess(): void {
    if (!this.hasAdvertiserRole()) {
      this.snackBar.open('No tienes permisos para acceder a esta sección', 'Cerrar', {
        duration: 4000
      });
      this.router.navigate(['/']);
    }
  }

  hasAdvertiserRole(): boolean {
    const roles = this.getUserRoles();
    return roles?.includes('advertiser') || false;
  }

}