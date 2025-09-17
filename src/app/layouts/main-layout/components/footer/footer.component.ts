import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

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
}