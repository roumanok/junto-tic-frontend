// layouts/main-layout/components/navigation/mega-menu/mega-menu.component.ts
import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mega-menu.component.html',
  styleUrl: './mega-menu.component.css'
})
export class MegaMenuComponent implements OnDestroy {
  @Input() categories: any[] = [];
  @Input() isMobileOpen: boolean = false;

  selectedCategoryId: string | null = null;
  hasSelectedCategory = false;
  private destroy$ = new Subject<void>();

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
    this.selectedCategoryId = null;
    this.hasSelectedCategory = false;
  }

  onLinkClick(): void {
    if (this.isMobile()) {
      this.closeMobileMenu();
    }
  }
}
