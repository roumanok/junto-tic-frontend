import { Component, OnInit, OnDestroy, Input, Output, Inject, EventEmitter, HostListener,PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subject, map } from 'rxjs';
import { CategoryService } from 'src/app/core/services/category.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { MMCategory, Subcategory, CategoryLink, Category } from 'src/app/core/models/category.model';

@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mega-menu.component.html',
  styleUrls: ['./mega-menu.component.css']
})

export class MegaMenuComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

  transformedCategories$: Observable<MMCategory[]>;
  activeCategory: string | null = null;
  openAccordion: string | null = null;
  
  private destroy$ = new Subject<void>();

  private allCategories: Category[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cats: CategoryService,
    public themeService: ThemeService
  ) {
    this.transformedCategories$ = this.cats.all$.pipe(
      map(categories => this.transformCategories(categories))
    );
    this.cats.all$.subscribe(categories => {
      this.allCategories = categories;      
    });
  }

  ngOnInit() {
    // Configuración inicial
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private transformCategories(categories: Category[]): MMCategory[] {
    // Filtrar solo categorías padre (sin parent_id o parent_id null)
    const parentCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === null);    
    return parentCategories.map(parentCat => {
      // Buscar categorías hijas
      const childCategories = categories.filter(cat => cat.parent_id === parentCat.id);
                 
      // Si no hay hijas, crear estructura básica con la misma categoría como subcategoría
      const subcategories: Subcategory[] = childCategories.length > 0 
        ? childCategories.map(child => ({
            id: child.id,
            title: child.name || child.slug,
            description: child.description,
            links: []
          }))
        : [
            {
              id: parentCat.id,
              title: 'Productos',
              links: [
                {
                  name: `Ver todo en ${parentCat.name || parentCat.slug}`,
                  url: `/category/${parentCat.slug}`
                },
                {
                  name: 'Novedades',
                  url: `/category/${parentCat.slug}/novedades`
                },
                {
                  name: 'Ofertas',
                  url: `/category/${parentCat.slug}/ofertas`
                }
              ]
            }
          ];
      return {
        id: parentCat.id,
        title: parentCat.name || parentCat.slug,
        description: parentCat.description,
        icon: parentCat.icon_url,
        subcategories: subcategories,
        featured: parentCat.is_featured,
        order: parentCat.sort_order
      };
    }).sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenar por sort_order
  }

  onCategoryHover(categoryId: string) {
    if (this.isMobile()) return;
    
    this.activeCategory = categoryId;
    this.showDesktopPanel();
  }

  onCategoryClick(categoryId: string, event: Event) {
    if (!this.isMobile()) return;
    
    event.preventDefault();
    event.stopPropagation();

    if (this.openAccordion === categoryId) {
      // Cerrar si ya está abierto
      this.openAccordion = null;
      this.activeCategory = null;
    } else {
      // Abrir el acordeón
      this.openAccordion = categoryId;
      this.activeCategory = categoryId;
      
      // Scroll suave al acordeón
      setTimeout(() => {
        if (isPlatformBrowser(this.platformId)) {
          const accordionElement = document.querySelector(`[data-acc="${categoryId}"]`);
          if (accordionElement) {
            accordionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
  }

  onLinkClick() {
    // Cerrar menú al hacer click en cualquier link
    this.closeMegaMenu();
  }

  closeMegaMenu() {
    this.resetMenuState();
    this.closeMenu.emit();
  }

  resetMenuState() {
    this.activeCategory = null;
    this.openAccordion = null;
  }

  showDesktopPanel() {
    if (this.isMobile() || !isPlatformBrowser(this.platformId)) return;
    
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu?.classList.remove('no-panel');
  }

   getCategorySlug(parentId: string, subcategoryId: string | undefined): string {
    // Buscar primero en subcategorías (categorías hijas)
    const subcategory = this.allCategories.find(cat => cat.id === subcategoryId);
    if (subcategory) {
      return subcategory.slug ? subcategory.slug : 'categoria-no-encontrada';
    }
    
    // Si no existe como subcategoría, usar la categoría padre
    const parentCategory = this.allCategories.find(cat => cat.id === parentId);
    return parentCategory?.slug || 'categoria-no-encontrada';
  }

  private isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.innerWidth <= 768;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.closeMegaMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isMobile()) {
      this.resetMenuState();
    }
  }
}