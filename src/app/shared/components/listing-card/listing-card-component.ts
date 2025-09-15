import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Listing } from '../../../core/models/listing.model';
import { CdnService } from '../../../core/services/cdn.service';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="listing-card" (click)="onCardClick()">
    <div class="listing-image">
      <img 
        *ngIf="listing.primary_image && listing.primary_image.image_url != ''; else placeholderImage"
        [src]="getMainImage() | async"
        [alt]="listing.title"
        class="image">
      
      <ng-template #placeholderImage>
        <div class="placeholder-icon">
          <i class="fas fa-image"></i>
        </div>
      </ng-template>
    </div>

    <div class="listing-info">
      <div class="listing-category">{{ listing.category && listing.category.name ? listing.category.name : '' }}</div>
      <h3 class="listing-title">{{ listing.title }}</h3>
      
      <div class="listing-price">
        <span *ngIf="listing.list_price" class="price-original">
          \${{ listing.list_price }}
        </span>
        <span class="price-current">
          \${{ listing.price }}
        </span>
      </div>

      <div class="listing-seller">
        {{ listing.advertiser && listing.advertiser.name ? listing.advertiser.name : '' }}
      </div>

      <button class="btn-view-more" (click)="onViewMore($event)">
        Ver más
      </button>
    </div>
  </div>
`,
  styles: [`
    .listing-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .listing-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .listing-image {
      width: 100%;
      height: 200px;
      position: relative;
      overflow: hidden;
      background: linear-gradient(45deg, 
        rgba(74, 144, 164, 0.1), 
        rgba(215, 48, 39, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-icon {
      font-size: 3rem;
      color: #4A90A4;
    }

    .listing-info {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .listing-category {
      font-size: 0.8rem;
      color: #D73027;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .listing-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #333;
      line-height: 1.4;
    }

    .listing-price {
      margin-bottom: 0.75rem;
    }

    .price-original {
      font-size: 0.9rem;
      color: #999;
      text-decoration: line-through;
      margin-right: 0.5rem;
    }

    .price-current {
      font-size: 1.2rem;
      font-weight: 700;
      color: #D73027;
    }

    .listing-seller {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .btn-view-more {
      width: 100%;
      background: linear-gradient(135deg, #4A90A4 0%, #2C5F6F 100%);
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      margin-top: auto;
    }

    .btn-view-more:hover {
      background: linear-gradient(135deg, #5BA0B4 0%, #3D7B8F 100%);
      transform: translateY(-2px);
    }
  `]
})
export class ListingCardComponent {
  @Input() listing!: Listing;
  @Output() cardClick = new EventEmitter<Listing>();
  @Output() viewMore = new EventEmitter<Listing>();

  constructor(
      private cdnService: CdnService          
  ) {}

  getMainImage(): Observable<string> {
    const mainImage = this.listing.primary_image;    
    return mainImage && mainImage.image_url
      ? this.cdnService.getCdnUrl$(mainImage.image_url)
      : of('/assets/images/placeholder.png');
  }

  onCardClick(): void {
    this.cardClick.emit(this.listing);
  }

  onViewMore(event: Event): void {
    event.stopPropagation();
    this.viewMore.emit(this.listing);
  }
}