// src/app/features/auth/pages/login-required/login-required.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';


@Component({
  selector: 'app-login-required',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './login-required.component.html' ,
  styleUrl: './login-required.component.css'
})
export class LoginRequiredComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  
  private returnUrl: string = '/';

  ngOnInit() {
    // Verificar si el usuario ya está logueado
    if (this.authService.isLoggedIn()) {
      // Si ya está logueado, redirigir al checkout o a la URL de retorno
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/checkout';
      this.router.navigate([returnUrl]);
      return;
    }
    
    // Guardar la URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.setupSEO();
  }

  login(): void {
    console.log('🔐 Iniciando login con URL de retorno:', this.returnUrl);
    this.authService.login(this.returnUrl);
  }

  register(): void {
    console.log('📝 Iniciando registro');
    this.authService.register();
  }

  goBack(): void {
    // Si hay returnUrl, volver ahí, sino ir al home
    if (this.returnUrl && this.returnUrl !== '/') {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME');     
    this.seo.setPageMeta(
      'PAGES.LOGIN_REQ.TITLE',
      'PAGES.LOGIN_REQ.DESCRIPTION',
      { communityName }
    );
  }
}