import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppState } from '../../../../store/app.state';
import * as AppActions from '../../../../store/app.actions';
import { MegaMenuComponent } from './mega-menu/mega-menu.component';
import { CategoryService } from 'src/app/core/services/category.service';
import { Category } from 'src/app/core/models/category.model';
import { selectIsMobileMenuOpen } from 'src/app/store/app.selectors';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MegaMenuComponent],
  template: `
    <nav class="nav">
      <div class="nav-container">
        <div class="nav-left">
          <button 
            class="mobile-menu-toggle" 
            (click)="toggleMobileMenu()"
            [class.active]="isMobileMenuOpen$ | async">
            <i class="fas fa-bars"></i>
          </button>
          
          <app-mega-menu 
            [categories]="(megaMenuData$ | async) ?? []"
            [isMobileOpen]="(isMobileMenuOpen$ | async) ?? false">
          </app-mega-menu>
          
          <div class="featured-categories">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="category-item">
              Inicio
            </a>
            <a href="#novedades" class="category-item">Novedades</a>
            <a href="#ofertas" class="category-item">Ofertas</a>
          </div>
        </div>
        
        <div class="user-actions">
          <!-- Futuras acciones de usuario -->
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav {
      background: white;
      padding: 1rem 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .nav-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-menu-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 45px;
      background: #f1f5f9;
      font-weight: 600;
      color: #326879;
      border: none;
      border-radius: 8px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 1000;
    }

    .featured-categories {
      display: flex;
      gap: 2rem;
      overflow-x: auto;
    }

    .category-item {
      color: #666;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 20px;
      transition: all 0.3s ease;
      white-space: nowrap;
      font-weight: 600;
    }

    .category-item:hover, 
    .category-item.active {
      background: #4A90A4;
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .nav {
        padding: 0;
      }

      .nav-container {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .nav-left {
        gap: 0.75rem;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .featured-categories {
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 8px;
      }

      .category-item {
        padding: 6px 12px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class NavigationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  megaMenuData$: Observable<Category[]>;
  isMobileMenuOpen$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private cats: CategoryService
  ) {
    this.megaMenuData$ = this.cats.all$;    
    this.isMobileMenuOpen$ = this.store.select(selectIsMobileMenuOpen);    
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu(): void {
    this.store.dispatch(AppActions.toggleMobileMenu());
  }
}