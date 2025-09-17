import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {  
  constructor(
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {}

  getLogoUrl(): string {
    const theme = this.themeService;
    if (theme?.assets().logo) {
      return theme.assetUrl(theme.assets().logo ? theme.assets().logo as string : '/med/logo.png');
    }
    return theme.assetUrl('/med/logo.png');
  }

  onSearch(input: HTMLInputElement | Event): void {
    let searchTerm = '';
    
    if (input instanceof HTMLInputElement) {
      searchTerm = input.value;
    } else if (input.target instanceof HTMLInputElement) {
      searchTerm = input.target.value;
    }

    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      // TODO: Implementar navegación a página de búsqueda
      // this.router.navigate(['/buscar'], { queryParams: { q: searchTerm } });
    }
  }
}