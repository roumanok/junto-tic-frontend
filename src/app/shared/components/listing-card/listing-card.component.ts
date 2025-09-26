import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { Listing } from '../../../core/models/listing.model';
import { CdnService } from '../../../core/services/cdn.service';
import { ListingService } from 'src/app/core/services/listing.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './listing-card.component.html',
  styleUrls: ['./listing-card.component.scss']
})
export class ListingCardComponent {
  @Input() listing!: Listing;
  @Output() cardClick = new EventEmitter<Listing>();
  @Output() viewMore = new EventEmitter<Listing>();

  constructor(
      private cdnService: CdnService,
      private router: Router,
      private listingService: ListingService 
  ) {}

  getMainImage(): Observable<string> {
    const mainImage = this.listing.primary_image;    
    return mainImage && mainImage.image_url
      ? this.cdnService.getCdnUrl$(mainImage.image_url)
      : of('placeholder.png');
  }

  onCardClick(): void {    
    const slug = this.listingService.generateSlugWithId(this.listing.title || 'listing', this.listing.id);
    this.router.navigate(['/articulo', slug]);
    this.cardClick.emit(this.listing);
  }

  onViewMore(event: Event): void {
    event.stopPropagation();    
    const slug = this.listingService.generateSlugWithId(this.listing.title || 'listing', this.listing.id);
    this.router.navigate(['/articulo', slug]);
    this.viewMore.emit(this.listing);
  }

  get formattedPrice(): string {    
    return this.listingService.getformattedPrice(this.listing?.price as string);
  }

  get formattedListPrice(): string {
    return this.listingService.getformattedPrice(this.listing?.list_price as string);
  }

}