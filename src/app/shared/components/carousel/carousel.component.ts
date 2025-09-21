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
  private currentX = 0;
  private isDragging = false;
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
        console.warn('No items found in carouselTrack');
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
    this.offset = this.currentIndex * (this.itemWidth + this.gap);
    this.slideChange.emit(this.currentIndex);
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
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.currentX = event.touches[0].clientX;
  }

  onTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const diff = this.startX - this.currentX;
    
    if (Math.abs(diff) > this.swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }
}