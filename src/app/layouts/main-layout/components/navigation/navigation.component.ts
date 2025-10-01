import { Component, OnInit, HostListener, Inject, inject, PLATFORM_ID, afterNextRender, signal} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MegaMenuComponent } from './mega-menu/mega-menu.component';
import { I18nService } from 'src/app/core/services/i18n.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MegaMenuComponent, TranslatePipe],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})

export class NavigationComponent implements OnInit {
  showCategoriesDropdown = false;
  showMobileMenu = false;
  public isHydrated = signal(false);

  private router = inject(Router);
  private i18n = inject(I18nService);
  private authService = inject(AuthService);
  
  featuredCategories = [
    { name: this.i18n.t('HEADER.MENU.NEWS'), url: '/novedades', active: false },
    { name: this.i18n.t('HEADER.MENU.OFFERS'), url: '/ofertas', active: false }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object    
  ) {
    afterNextRender(() => {
      this.isHydrated.set(true);
    });
  }

  ngOnInit() {
    // Configuración inicial
  }

  toggleCategoriesDropdown() {
    if (this.isMobile()) return;
    
    this.showCategoriesDropdown = !this.showCategoriesDropdown;
    
    if (this.showCategoriesDropdown) {
      this.showMobileMenu = false;
    }
  }

  toggleMobileMenu() {
    if (!this.isMobile()) return;
    
    this.showMobileMenu = !this.showMobileMenu;
    this.showCategoriesDropdown = this.showMobileMenu;
  }

  closeMegaMenu() {
    this.showCategoriesDropdown = false;
    this.showMobileMenu = false;
  }

  isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.innerWidth <= 768;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {

    if (!isPlatformBrowser(this.platformId)) return;    

    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.categories-dropdown');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    const isClickInside = dropdown?.contains(target);
    const isClickOnMobileToggle = mobileToggle?.contains(target);
    const isClickOnCategoriesBtn = target.closest('.categories-btn');
    
    if (this.showCategoriesDropdown && 
        !isClickInside && 
        !isClickOnMobileToggle && 
        !isClickOnCategoriesBtn) {
      this.closeMegaMenu();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showCategoriesDropdown || this.showMobileMenu) {
      this.closeMegaMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {

    if (!isPlatformBrowser(this.platformId)) return;

    // Cerrar menús al cambiar de mobile a desktop y viceversa
    const wasMobile = this.showMobileMenu;
    const isNowMobile = this.isMobile();
    
    if (wasMobile && !isNowMobile) {
      this.closeMegaMenu();
    }
  }

  isLoading(): boolean {    
    return this.authService.isLoading();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  login(): void {
    console.log('🔐 Iniciando login desde navigation...');
    this.authService.login(this.router.url);
  }

  register(): void {
    console.log('📝 Iniciando registro desde navigation...');
    this.authService.register();
  }

  logout(): void {
    console.log('👋 Cerrando sesión desde navigation...');
    this.authService.logout();
  }

  getUsername(): string {
    return this.authService.getUsername();
  }
}