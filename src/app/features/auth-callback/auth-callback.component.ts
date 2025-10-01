import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <h3>Procesando autenticación...</h3>
      <p>Redirigiendo...</p>
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

  ngOnInit(): void {
    console.log('=== AUTH CALLBACK ===');
    
    setTimeout(() => {
      const isAuth = this.authService.isLoggedIn();
      console.log('¿Está autenticado?', isAuth);
      
      if (isAuth) {
        // Intentar obtener la URL de retorno de múltiples fuentes
        let returnUrl = this.getReturnUrl();
        
        console.log('📍 Redirigiendo a:', returnUrl);
        this.router.navigateByUrl(returnUrl);
      } else {
        console.error('❌ No se pudo autenticar');
        this.router.navigate(['/']);
      }
    }, 500);
  }

  private getReturnUrl(): string {
    // 1. Intentar desde query params (viene del state de OAuth)
    const stateParam = this.route.snapshot.queryParams['state'];
    if (stateParam) {
      try {
        // El state puede venir como base64 o directamente
        const decoded = atob(stateParam);
        if (decoded && decoded.startsWith('/')) {
          return decoded;
        }
      } catch (e) {
        // Si no se puede decodificar, usar tal cual
        if (stateParam.startsWith('/')) {
          return stateParam;
        }
      }
    }

    // 2. Intentar desde sessionStorage (backup)
    const savedUrl = sessionStorage.getItem('auth_redirect_url');
    if (savedUrl && savedUrl !== '/login' && savedUrl !== '/login-required') {
      sessionStorage.removeItem('auth_redirect_url'); // Limpiar después de usar
      return savedUrl;
    }

    // 3. Por defecto, ir al home
    return '/';
  }
}