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
    if (this.authService.isLoggedIn()) {      
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/checkout';
      console.log('🔐 Usuario ya logueado, redirigiendo a:', returnUrl);
      this.router.navigate([returnUrl]);
      return;
    }    
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    console.log('Usuario no logueado, returnUrl:', this.returnUrl);
    this.setupSEO();
  }

  login(): void {
    const targetUrl = this.returnUrl !== '/' ? this.returnUrl : '/checkout';
    this.authService.login(targetUrl);
  }

  register(): void {
    this.authService.register();
  }

  goBack(): void {
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