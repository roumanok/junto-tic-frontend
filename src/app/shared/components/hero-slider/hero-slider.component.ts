// src/app/shared/components/hero-slider/hero-slider.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

export interface SlideConfig {
  image: string;
  imageMobile?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

export interface SliderConfig {
  slides: SlideConfig[];
}

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-slider.component.html',
  styleUrls: ['./hero-slider.component.css']
})
export class HeroSliderComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer?: ElementRef;

  private themeService = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  
  slides: SlideConfig[] = [];
  private swiper?: Swiper;

  ngOnInit(): void {
    // Obtener slides desde el ThemeService
    const sliderConfig = this.themeService.slider();
    
    if (sliderConfig && sliderConfig.slides && sliderConfig.slides.length > 0) {
      this.slides = sliderConfig.slides.map(slide => ({
        image: this.themeService.assetUrl(slide.image),
        imageMobile: slide.imageMobile ? this.themeService.assetUrl(slide.imageMobile) : undefined,
        title: slide.title,
        subtitle: slide.subtitle,
        link: slide.link,
        buttonText: slide.buttonText || 'Ver más'
      }));
    } else {
      this.slides = [];
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initSwiper();
    }
  }

  private initSwiper(): void {
    if (!this.swiperContainer) return;

    setTimeout(() => {
      this.swiper = new Swiper(this.swiperContainer!.nativeElement, {
        modules: [Navigation, Pagination, Autoplay, EffectFade],
        loop: this.slides.length > 1,
        autoplay: this.slides.length > 1 ? {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        } : false,
        speed: 800,
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        navigation: this.slides.length > 1 ? {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        } : false,
        pagination: this.slides.length > 1 ? {
          el: '.swiper-pagination',
          clickable: true,
          dynamicBullets: true,
        } : false,
        grabCursor: true,
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        a11y: {
          prevSlideMessage: 'Slide anterior',
          nextSlideMessage: 'Siguiente slide',
          paginationBulletMessage: 'Ir al slide {{index}}'
        }
      });
    }, 100);
  }  

  onSlideClick(slide: SlideConfig): void {
    if (slide.link) {
      window.location.href = slide.link;
    }
  }

  ngOnDestroy(): void {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
  }
}