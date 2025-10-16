import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CategoryService } from 'src/app/core/services/category.service';
import { Category } from 'src/app/core/models/category.model';
import { CdnService } from 'src/app/core/services/cdn.service';

@Component({
  selector: 'app-featured-categories',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-categories.component.html',
  styleUrl: './featured-categories.component.css'
})
export class FeaturedCategoriesComponent implements OnInit, OnDestroy {
  featuredCategories$: Observable<Category[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private cdnService: CdnService)
  {
    this.featuredCategories$ = this.categoryService.featured$;
  }

  ngOnInit(): void {
    this.featuredCategories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        console.log('Featured categories loaded:', categories.length);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  getDefaultCategoryImage(slug: string): Observable<string> {
    return this.cdnService.getCdnUrl$('/gen/med/cat/' + slug + '.png');
  }

  getCategoryImage(image_url: string | undefined): Observable<string> {      
      return this.cdnService.getCdnUrl$(image_url);
  }

  onImageError(event: Event, slug: string): void {
    const img = event.target as HTMLImageElement;
    this.getDefaultCategoryImage(slug).subscribe(url => {
      img.src = url;
    });
  }
}