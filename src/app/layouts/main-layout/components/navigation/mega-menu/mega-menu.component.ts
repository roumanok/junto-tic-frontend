// layouts/main-layout/components/navigation/mega-menu/mega-menu.component.ts
import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';

import { AppState } from '../../../../../store/app.state';
import * as AppActions from '../../../../../store/app.actions';

@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="categories-dropdown" [class.active]="isMobileOpen">
      <button class="categories-btn" (click)="toggleDropdown()" *ngIf="!isMobile()">
        <i class="fas fa-bars"></i> Categorías
        <span class="dropdown-arrow"><i class="fas fa-chevron-down"></i></span>
      </button>
      
      <div class="dropdown-menu" [class.no-panel]="!hasSelectedCategory">
        <!-- Header móvil -->
        <div class="mega-mobile-header" *ngIf="isMobile()">
          <img 
            src="/assets/images/logo-junto-a-tic.svg" 
            alt="Logo" 
            class="logo-img">
          <button 
            class="mega-close-btn" 
            (click)="closeMobileMenu()" 
            aria-label="Cerrar menú">
            Cerrar
          </button>
        </div>
        
        <div class="mega-grid">
          <!-- Izquierda: Categorías padre -->
          <aside class="mega-left">
            <div class="mega-mobile-user-actions" *ngIf="isMobile()">
              <!-- Futuras acciones de usuario -->
            </div>
            
            <div class="mega-mobile-categories-title" *ngIf="isMobile()">
              Categorías
            </div>
            
            <ul class="mega-parents">
              <li 
                *ngFor="let category of categories" 
                [attr.data-panel]="category.id"
                [class.active]="selectedCategoryId === category.id"
                (mouseenter)="onDesktopHover(category.id)"
                (click)="onMobileClick(category.id)">
                
                <div class="acc-title">
                  {{ category.title }}
                  <i class="fa fa-chevron-right chev"></i>
                </div>
                
                <!-- Acordeón móvil -->
                <div 
                  class="acc-children" 
                  [class.open]="isMobile() && selectedCategoryId === category.id"
                  [attr.data-acc]="category.id">
                  <div class="mega-columns">
                    <div 
                      class="mega-col" 
                      *ngFor="let subcategory of category.subcategories">
                      <h4>{{ subcategory.title }}</h4>
                      <ul class="mega-links">
                        <li *ngFor="let link of subcategory.links">
                          <a [routerLink]="link.url" (click)="onLinkClick()">
                            {{ link.name }}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </aside>
          
          <!-- Derecha: Panel de subcategorías (solo desktop) -->
          <section class="mega-right" *ngIf="!isMobile()">
            <div 
              class="mega-panel" 
              *ngFor="let category of categories"
              [class.active]="selectedCategoryId === category.id"
              [id]="'panel-' + category.id">
              <div class="mega-columns">
                <div 
                  class="mega-col" 
                  *ngFor="let subcategory of category.subcategories">
                  <h4>{{ subcategory.title }}</h4>
                  <ul class="mega-links">
                    <li *ngFor="let link of subcategory.links">
                      <a [routerLink]="link.url" (click)="onLinkClick()">
                        {{ link.name }}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .categories-dropdown {
      position: relative;
    }

    .categories-btn {
      background: #D73027;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .categories-btn:hover {
      background: #B8242A;
    }

    .dropdown-arrow {
      transition: transform 0.3s ease;
    }

    .categories-dropdown.active .dropdown-arrow i {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      min-width: 300px;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      z-index: 1000;
      margin-top: 8px;
      width: 900px;
      max-width: 92vw;
      padding: 10px;
    }

    .dropdown-menu.no-panel {
      width: auto;
    }

    .categories-dropdown.active .dropdown-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .mega-grid {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 380px;
    }

    .mega-left {
      border-right: 1px solid #eef1f4;
      padding: 8px;
    }

    .mega-right {
      padding: 16px 18px;
      overflow: auto;
    }

    .mega-mobile-user-actions,
    .mega-mobile-categories-title,
    .mega-mobile-header {
      display: none;
    }

    .mega-parents {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .mega-parents li {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      color: #2f3a45;
    }

    .mega-parents li .chev {
      margin-left: auto;
      opacity: 0.6;
    }

    .mega-parents li:hover {
      background: #f5f8fa;
    }

    .mega-parents li.active {
      background: #e9f2f6;
      color: #0f5f74;
    }

    .mega-parents li .acc-title {
      display: inline-flex;
      justify-content: space-around;
      width: 100%;
      align-items: center;
    }

    .mega-panel {
      display: none;
      animation: fadeIn 0.18s ease;
    }

    .mega-panel.active {
      display: block;
    }

    .mega-columns {
      display: grid;
      grid-template-columns: repeat(3, minmax(160px, 1fr));
      gap: 18px;
    }

    .mega-col h4 {
      margin: 0 0 8px;
      font-size: 0.95rem;
      color: #0f5f74;
    }

    .mega-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mega-links a {
      text-decoration: none;
      color: #56636d;
      font-size: 0.95rem;
      border-radius: 6px;
      padding: 6px 8px;
      display: block;
    }

    .mega-links a:hover {
      background: #f2f6f8;
      color: #D73027;
    }

    .acc-children {
      display: none;
    }

    .dropdown-menu.no-panel .mega-right {
      display: none;
    }

    .dropdown-menu.no-panel .mega-left {
      border-right: 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* Responsive móvil */
    @media (max-width: 768px) {
      .dropdown-menu {
        position: fixed;
        inset: 0;
        margin: 0;
        border-radius: 0;
        width: auto;
        max-width: none;
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      .mega-mobile-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 16px;
        border-bottom: 1px solid #eef1f4;
        position: sticky;
        top: 0;
        background: linear-gradient(135deg, #4A90A4 0%, #2C5F6F 100%);
        z-index: 2;
      }

      .mega-mobile-header .logo-img {
        height: 35px;
      }

      .mega-mobile-header strong {
        font-weight: 800;
        color: white;
      }

      .mega-mobile-user-actions {
        display: flex;
        margin-top: 20px;
        width: 100%;
        justify-content: center;
        gap: 10px;
      }

      .mega-mobile-categories-title {
        display: block;
        font-weight: 800;
        padding: 25px 10px 5px 10px;
        font-size: 18px;
      }

      .mega-close-btn {
        margin-left: auto;
        background: #f1f5f9;
        border: 0;
        border-radius: 10px;
        padding: 8px 12px;
        font-weight: 600;
        color: #334155;
      }

      .mega-grid {
        display: block;
        flex: 1 1 auto;
        overflow: auto;
        height: auto;
      }

      .mega-left {
        border-right: 0;
        padding: 0;
        height: 100%;
        overflow: auto;
      }

      .mega-right {
        display: none !important;
      }

      .mega-parents li {
        border-bottom: 1px solid #f1f5f9;
        border-radius: 0;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 10px;
        padding: 14px 16px;
      }

      .mega-parents li .chev {
        margin-left: auto;
        transition: transform 0.18s;
      }

      .mega-parents li.active .chev {
        transform: rotate(90deg);
      }

      .acc-children {
        display: none;
        padding: 12px 16px;
        background: #fafcff;
        width: 100%;
      }

      .acc-children.open {
        display: block;
      }

      .acc-children .mega-columns {
        display: block !important;
      }

      .acc-children .mega-col {
        padding: 10px 0;
        border-bottom: 1px solid #eef1f4;
      }

      .acc-children .mega-col:last-child {
        border-bottom: 0;
      }

      .acc-children .mega-links {
        display: inline-flex;
        flex-direction: column;
        width: 100%;
        gap: 0px;
        align-items: flex-start;
      }

      .acc-children .mega-links li {
        margin: 0;
        gap: 0px;
        padding: 5px 15px;
      }

      .acc-children .mega-links a {
        display: block;
        padding: 6px 0;
      }
    }
  `]
})
export class MegaMenuComponent implements OnDestroy {
  @Input() categories: any[] = [];
  @Input() isMobileOpen: boolean = false;

  selectedCategoryId: string | null = null;
  hasSelectedCategory = false;
  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  toggleDropdown(): void {
    if (!this.isMobile()) {
      // En desktop, manejar el dropdown localmente
      // TODO: Implementar lógica de dropdown desktop
    }
  }

  onDesktopHover(categoryId: string): void {
    if (!this.isMobile()) {
      this.selectedCategoryId = categoryId;
      this.hasSelectedCategory = true;
    }
  }

  onMobileClick(categoryId: string): void {
    if (this.isMobile()) {
      if (this.selectedCategoryId === categoryId) {
        this.selectedCategoryId = null;
      } else {
        this.selectedCategoryId = categoryId;
      }
    }
  }

  closeMobileMenu(): void {
    this.store.dispatch(AppActions.closeMobileMenu());
    this.selectedCategoryId = null;
    this.hasSelectedCategory = false;
  }

  onLinkClick(): void {
    if (this.isMobile()) {
      this.closeMobileMenu();
    }
  }
}
