import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Listing } from '../../../core/models/listing.model';
import { CdnService } from '../../../core/services/cdn.service';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listing-card.component.html',
  styleUrls: ['./listing-card.component.scss']
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