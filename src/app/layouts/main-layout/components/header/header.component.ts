import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';

import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {  
  constructor(
    public themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {}  

  onSearch(input: HTMLInputElement | Event): void {
    let searchTerm = '';
    
    if (input instanceof HTMLInputElement) {
      searchTerm = input.value.trim();
    } else if (input.target instanceof HTMLInputElement) {
      searchTerm = input.target.value.trim();
    }

    if (searchTerm) {
      // Navegar a la página de búsqueda con el término como parámetro de ruta
      this.router.navigate(['/buscar', searchTerm]);
      
      // Limpiar el campo de búsqueda si es un input
      if (input instanceof HTMLInputElement) {
        input.value = '';
      } else if (input.target instanceof HTMLInputElement) {
        input.target.value = '';
      }
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearch(event.target as HTMLInputElement);
    }
  }

}