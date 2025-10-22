import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Advertiser } from 'src/app/core/models/advertiser.model';
import { AdvertiserService } from 'src/app/core/services/advertiser.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { CarouselComponent } from 'src/app/shared/components/carousel/carousel.component';

@Component({
  selector: 'app-featured-advertisers',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TranslatePipe,
    CarouselComponent
  ],
  templateUrl: './featured-advertisers.component.html',
  styleUrl: './featured-advertisers.component.css'
})
export class FeaturedAdvertisersComponent implements OnInit, OnDestroy {
  advertisers: Advertiser[] = [];
  loading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  private advertiserService = inject(AdvertiserService);
  private cdnService = inject(CdnService);

  ngOnInit(): void {
    this.loadFeaturedAdvertisers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFeaturedAdvertisers(): void {
    this.advertiserService.getFeaturedAdvertisers()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading featured advertisers:', err);
          this.error = 'Error al cargar los anunciantes';
          this.loading = false;
          throw err;
        })
      )
      .subscribe({
        next: (advertisers) => {
          this.advertisers = advertisers;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  getAdvertiserUrl(advertiser: Advertiser): string {
    return `/anunciante/${advertiser.slug}-aid-${advertiser.id}`;
  }

  getAdvertiserLogoUrl(advertiser: Advertiser): string {
    if (!advertiser.logo_url) {
      return this.getDefaultLogo();
    }
    return this.cdnService.getCdnUrl(advertiser.logo_url);
  }

  getDefaultLogo(): string {
    return this.cdnService.getCdnUrl('/gen/med/advertiser-placeholder.png');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getDefaultLogo();
  }

  trackByAdvertiser(index: number, advertiser: Advertiser): string {
    return advertiser.id;
  }
}