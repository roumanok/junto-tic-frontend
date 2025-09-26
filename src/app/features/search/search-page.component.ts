import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SearchService, SearchFilters, SearchResult } from './services/search.service';
import { CategoryService } from '../../core/services/category.service';
import { SeoService } from '../../core/services/seo.service';
import { Category } from '../../core/models/category.model';
import { Listing } from '../../core/models/listing.model';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from 'src/app/core/services/i18n.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbComponent,
    ListingCardComponent,
    PaginationComponent,    
    TranslatePipe
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  searchForm: FormGroup;
  searchResult: SearchResult | null = null;
  categories: Category[] = [];
  loading = false;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  currentPage = 1;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private searchService: SearchService,
    private categoryService: CategoryService,
    private seo: SeoService,
    private i18n: I18nService
  ) {
    this.searchForm = this.fb.group({
      category_id: [''],
      min_price: [''],
      max_price: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupRouteSubscription();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteSubscription(): void {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      switchMap(([params, queryParams]) => {
        const searchTerm = params['searchTerm'] || '';
        const page = parseInt(queryParams['page']) || 1;
        
        this.currentPage = page;
        this.setupSEO(searchTerm);
        this.updateBreadcrumb(searchTerm);
        
        // Actualizar form con query params
        this.searchForm.patchValue({
          category_id: queryParams['category'] || '',
          min_price: queryParams['min_price'] || '',
          max_price: queryParams['max_price'] || ''
        }, { emitEvent: false });

        if (!searchTerm.trim()) {
          this.searchResult = null;
          return [null];
        }

        this.loading = true;
        
        const filters: SearchFilters = {
          page,
          category_id: queryParams['category'] || undefined,
          min_price: queryParams['min_price'] ? parseFloat(queryParams['min_price']) : undefined,
          max_price: queryParams['max_price'] ? parseFloat(queryParams['max_price']) : undefined
        };

        return this.searchService.searchListings(searchTerm, filters);
      })
    ).subscribe({
      next: (result) => {
        this.searchResult = result;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error in search:', error);
        this.loading = false;
        this.searchResult = null;
      }
    });
  }

  private setupFormSubscription(): void {
    this.searchForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private loadCategories(): void {
    this.categoryService.all$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(categories => {
      this.categories = categories;
    });
  }

  private setupSEO(searchTerm: string): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME');     
    this.seo.setPageMeta(
      'SEARCH.TITLE_WITH_TERM',
      'SEARCH.DESCRIPTION',
      { searchTerm, communityName }
    );
  }


  private updateBreadcrumb(searchTerm: string): void {
    this.breadcrumbItems = [
      { label: 'Inicio', url: '/' },
      { 
        label: searchTerm ? `Búsqueda: "${searchTerm}"` : 'Búsqueda', 
        url: '' 
      }
    ];
  }

  onPageChange(page: number): void {
    const queryParams = {
      ...this.route.snapshot.queryParams,
      page: page > 1 ? page.toString() : undefined
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private applyFilters(): void {
    const searchTerm = this.route.snapshot.params['searchTerm'];
    if (!searchTerm) return;

    const formValue = this.searchForm.value;
    const queryParams: any = {};

    // Solo agregar parámetros no vacíos
    if (formValue.category_id) {
      queryParams.category = formValue.category_id;
    }
    if (formValue.min_price && parseFloat(formValue.min_price) > 0) {
      queryParams.min_price = formValue.min_price;
    }
    if (formValue.max_price && parseFloat(formValue.max_price) > 0) {
      queryParams.max_price = formValue.max_price;
    }

    // Resetear página al aplicar filtros
    delete queryParams.page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  clearFilters(): void {
    this.searchForm.reset();
    
    const searchTerm = this.route.snapshot.params['searchTerm'];
    this.router.navigate(['/buscar', searchTerm]);
  }

  get hasActiveFilters(): boolean {
    const value = this.searchForm.value;
    return !!(value.category_id || value.min_price || value.max_price);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name as string : '';
  }

  trackByListingId(index: number, listing: Listing): string {
    return listing.id;
  }
}