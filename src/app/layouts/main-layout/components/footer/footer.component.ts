import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  private i18n = inject(I18nService);

  constructor(
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {}

  getCopyrightText(): string {
    return this.i18n.t('FOOTER.COPYRIGHT', { currentYear: this.currentYear });
  }
}