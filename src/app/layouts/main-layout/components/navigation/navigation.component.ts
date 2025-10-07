import { Component, OnInit, HostListener, Inject, inject, PLATFORM_ID, afterNextRender, signal} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
  showAccountDropdown = false;
  public isHydrated = signal(false);

  private destroy$ = new Subject<void>();
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

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }  

  toggleCategoriesDropdown() {
    if (this.isMobile()) return;    
    this.showCategoriesDropdown = !this.showCategoriesDropdown;
    this.showAccountDropdown = false;
  }

  toggleAccountDropdown() {
    if (this.isMobile()) return;
    
    this.showAccountDropdown = !this.showAccountDropdown;
    this.showCategoriesDropdown = false; 
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    this.showCategoriesDropdown = true;
    this.showAccountDropdown = false;
  }
  
  closeMegaMenu() {
    this.showCategoriesDropdown = false;
    this.showMobileMenu = false;
    this.showAccountDropdown = false;
  }

  isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.innerWidth <= 768;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) return;

    const target = event.target as HTMLElement;
    const isClickInside = target.closest('.dropdown-menu') || target.closest('.account-dropdown-menu');
    const isClickOnMobileToggle = target.closest('.mobile-menu-toggle');
    const isClickOnCategoriesBtn = target.closest('.categories-btn');
    const isClickOnAccountBtn = target.closest('.account-btn');

    if ((this.showCategoriesDropdown || this.showAccountDropdown) && 
        !isClickInside && 
        !isClickOnMobileToggle && 
        !isClickOnCategoriesBtn &&
        !isClickOnAccountBtn) {
      this.closeMegaMenu();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showCategoriesDropdown || this.showMobileMenu || this.showAccountDropdown) {
      this.closeMegaMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (!isPlatformBrowser(this.platformId)) return;

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

  hasRole(role: string): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes(role);
  }

  navigateToMyOrders(): void {
    this.router.navigate(['/mi-cuenta/mis-compras']);
    this.closeMegaMenu();
  }

  navigateToSell(): void {
    this.router.navigate(['/vender']);
    this.closeMegaMenu();
  }

  navigateToMySales(): void {
    this.router.navigate(['/mi-cuenta/mis-ventas']);
    this.closeMegaMenu();
  }

  navigateToMyListings(): void {
    this.router.navigate(['/mi-cuenta/mis-articulos']);
    this.closeMegaMenu();
  }
}