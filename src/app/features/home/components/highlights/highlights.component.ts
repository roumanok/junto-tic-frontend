import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from 'src/app/core/services/i18n.service';

interface Highlight {
  icon: string;
  title: string;
  description: string;
  id?: string;
}

@Component({
  selector: 'app-highlights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './highlights.component.html',
  styleUrl: './highlights.component.css'
})
export class HighlightsComponent {

  private i18n = inject(I18nService);

  @Input() highlights: Highlight[] = [
    {
      icon: this.i18n.t('PAGES.HOME:HIGHLIGHTS.FIRST.ICON'),
      title: this.i18n.t('PAGES.HOME:HIGHLIGHTS.FIRST.TITLE'),
      description: this.i18n.t('PAGES.HOME:HIGHLIGHTS.FIRST.DESCRIPTION')
    },
    {
      icon: this.i18n.t('PAGES.HOME:HIGHLIGHTS.SECOND.ICON'),
      title: this.i18n.t('PAGES.HOME:HIGHLIGHTS.SECOND.TITLE'),
      description: this.i18n.t('PAGES.HOME:HIGHLIGHTS.SECOND.DESCRIPTION')
    },
    {
      icon: this.i18n.t('PAGES.HOME:HIGHLIGHTS.THIRD.ICON'),
      title: this.i18n.t('PAGES.HOME:HIGHLIGHTS.THIRD.TITLE'),
      description: this.i18n.t('PAGES.HOME:HIGHLIGHTS.THIRD.DESCRIPTION')
    }
  ];

  trackByFn(index: number, item: Highlight): string {
    return item.id || item.title;
  }

  onHighlightClick(highlight: Highlight): void {
    console.log('Highlight clicked:', highlight.title);    
  }
}