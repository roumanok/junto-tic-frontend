import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild ,Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() itemWidth: number = 280;
  @Input() gap: number = 32;
  @Input() visibleItems: number = 4;
  @Output() slideChange = new EventEmitter<number>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,    
  ) {};

  @ViewChild('carouselTrack') carouselTrack!: ElementRef; 
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  currentIndex = 0;
  maxIndex = 0;
  offset = 0;
  totalItems = 0;

  // Touch handling
  private startX = 0;
  private startY = 0;  // ← AGREGAR
  private currentX = 0;
  private currentY = 0;  // ← AGREGAR
  private isDragging = false;
  private isHorizontalSwipe = false;  // ← AGREGAR
  private swipeThreshold = 50;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.updateCarousel();
    this.setupResizeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngAfterViewInit(): void {    
      if (isPlatformBrowser(this.platformId)) {        
        this.calculateDimensions();
      }
  }
  private setupResizeListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.calculateDimensions();
      });
    }
  }

  private calculateDimensions(): void {    
    if (this.carouselTrack?.nativeElement) {      
      this.totalItems = this.carouselTrack.nativeElement.children.length;      
      if (this.totalItems === 0) {        
        setTimeout(() => this.calculateDimensions(), 100);        
      }
      else{
        this.visibleItems = this.getVisibleItems();
        this.maxIndex = Math.max(0, this.totalItems - this.visibleItems);
        this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
        this.updateCarousel();
      }
    }
  }

  private getVisibleItems(): number {
    if (typeof window === 'undefined') return 4;    
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 768) return 3;
    if (width >= 480) return 2;
    return 1;
  }

  private updateCarousel(): void {
    const itemWidth = this.getCurrentItemWidth();
    const gap = this.getCurrentGap();
    this.offset = this.currentIndex * (itemWidth + gap);
    this.slideChange.emit(this.currentIndex);
  }

  private getCurrentItemWidth(): number {
    if (typeof window === 'undefined') return this.itemWidth;
    
    const width = window.innerWidth;
    if (width >= 768) return this.itemWidth; // Desktop: 280px
    if (width >= 480) return 250;            // Mobile landscape: 250px
    return 250;                              // Mobile portrait: 250px
  }

  private getCurrentGap(): number {
    if (typeof window === 'undefined') return this.gap;
    
    const width = window.innerWidth;
    if (width >= 768) return this.gap;  // Desktop: 32px
    return 16;                          // Mobile: 16px
  }

  nextSlide(): void {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  prevSlide(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.isDragging = false;
    this.isHorizontalSwipe = false;
  }

  onTouchMove(event: TouchEvent): void {
    if (!event.touches[0]) return;

    this.currentX = event.touches[0].clientX;
    this.currentY = event.touches[0].clientY;

    const deltaX = Math.abs(this.currentX - this.startX);
    const deltaY = Math.abs(this.currentY - this.startY);

    if (!this.isDragging && !this.isHorizontalSwipe) {
      if (deltaX > deltaY && deltaX > 10) {
        this.isHorizontalSwipe = true;
        this.isDragging = true;
      }
      else if (deltaY > deltaX && deltaY > 10) {
        this.isDragging = false;
        return;
      }
      else {
        return;
      }
    }

    if (this.isHorizontalSwipe) {
      event.preventDefault();
    }
  }

  onTouchEnd(): void {
    if (!this.isDragging || !this.isHorizontalSwipe) {
      this.isDragging = false;
      this.isHorizontalSwipe = false;
      return;
    }

    const diff = this.startX - this.currentX;    
    
    if (Math.abs(diff) > this.swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }

    this.isDragging = false;
    this.isHorizontalSwipe = false;
  }
}