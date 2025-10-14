// src/app/features/auth-callback/auth-callback.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommunityService } from 'src/app/core/services/community.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <h3>Procesando autenticación...</h3>
      <p>{{ statusMessage }}</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private communityService = inject(CommunityService);

  statusMessage = 'Redirigiendo...';

  async ngOnInit(): Promise<void> {
    console.log('=== AUTH CALLBACK ===');
    
    try {
      // Esperar un poco para que OAuth termine de procesar
      await this.delay(500);
      
      const isAuth = this.authService.isLoggedIn();
      console.log('¿Está autenticado?', isAuth);
      
      if (isAuth) {
        // IMPORTANTE: Cargar los datos del usuario desde la API
        this.statusMessage = 'Cargando tu perfil...';
        
        // Esperar a que el community ID esté disponible
        await this.communityService.ensureLoaded();
        
        // Cargar los roles del usuario desde /api/auth/me
        await this.authService.loadUserFromApi();
        
        console.log('✅ Roles cargados:', this.authService.getUserRoles());
        
        // Obtener la URL de retorno
        const returnUrl = this.getReturnUrl();
        
        console.log('📍 Redirigiendo a:', returnUrl);
        this.router.navigateByUrl(returnUrl);
      } else {
        console.error('❌ No se pudo autenticar');
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('❌ Error en el proceso de autenticación:', error);
      this.statusMessage = 'Error al procesar la autenticación';
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getReturnUrl(): string {
    const stateParam = this.route.snapshot.queryParams['state'];
    if (stateParam) {
      try {
        const decoded = atob(stateParam);
        if (decoded && decoded.startsWith('/')) {
          return decoded;
        }
      } catch (e) {
        if (stateParam.startsWith('/')) {
          return stateParam;
        }
      }
    }

    const savedUrl = sessionStorage.getItem('auth_redirect_url');
    if (savedUrl && savedUrl !== '/login' && savedUrl !== '/login-required') {
      sessionStorage.removeItem('auth_redirect_url');
      return savedUrl;
    }

    return '/';
  }
}