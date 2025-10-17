import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TranslatePipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, AfterViewInit {  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateSearchInput(event.urlAfterRedirects);
    });
  }  

  ngAfterViewInit(): void {
    this.updateSearchInput(this.router.url);
  }

  private updateSearchInput(url: string): void {
    const match = url.match(/\/buscar\/([^?]+)/);
    if (match && this.searchInput) {
      const searchTerm = decodeURIComponent(match[1]);
      this.searchInput.nativeElement.value = searchTerm;
    } else if (this.searchInput && !url.includes('/buscar/')) {
      this.searchInput.nativeElement.value = '';
    }
  }

  onSearch(input: HTMLInputElement | Event): void {
    let searchTerm = '';
    
    if (input instanceof HTMLInputElement) {
      searchTerm = input.value.trim();
    } else if (input.target instanceof HTMLInputElement) {
      searchTerm = input.target.value.trim();
    }

    if (searchTerm) {
      this.router.navigate(['/buscar', searchTerm]);
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearch(event.target as HTMLInputElement);
    }
  }

  getLogoUrl(): string {
    return this.themeService.getLogoUrl();
  }

}