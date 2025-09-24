import { Component, Input, Inject, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { CdnService } from '../../../core/services/cdn.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.css'
})
export class ImageGalleryComponent {
  @Input() images: GalleryImage[] = [];
  @Input() title: string = '';
  
  currentImageIndex = 0;
  showZoom = false;
  private isBrowser: boolean;

  constructor(
    private cdnService: CdnService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange) {
      this.currentImageIndex = 0;
    }
  }

  getImageUrl(image: GalleryImage): Observable<string> {
    if (!image || !image.image_url) {
      return of('/assets/images/placeholder.png');
    }
    return this.cdnService.getCdnUrl$(image.image_url);
  }

  changeImage(index: number): void {
    if (index >= 0 && index < this.images.length) {
      this.currentImageIndex = index;
    }
  }

  previousImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const newIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.images.length - 1;
    this.changeImage(newIndex);
  }

  nextImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const newIndex = this.currentImageIndex < this.images.length - 1 ? this.currentImageIndex + 1 : 0;
    this.changeImage(newIndex);
  }

  openZoom(): void {
    if (this.images.length === 0) return;
    
    this.showZoom = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeZoom(): void {
    this.showZoom = false;
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }
}