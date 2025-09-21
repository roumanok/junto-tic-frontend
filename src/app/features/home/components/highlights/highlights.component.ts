import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() highlights: Highlight[] = [
    {
      icon: 'fa-shipping-fast',
      title: 'ENVÍO A TODO EL PAÍS',
      description: 'Envío gratis en compras mayores a $50.000. Retiro gratuito en la comunidad.'
    },
    {
      icon: 'fa-certificate',
      title: 'PRODUCTOS OFICIALES',
      description: 'Productos y servicios con licencia oficial de la comunidad.'
    },
    {
      icon: 'fa-utensils',
      title: 'NUESTRO RESTAURANT',
      description: 'Reservá experiencias gastronómicas únicas en Tu Barrio.'
    }
  ];

  trackByFn(index: number, item: Highlight): string {
    return item.id || item.title;
  }

  onHighlightClick(highlight: Highlight): void {
    console.log('Highlight clicked:', highlight.title);
    // Aquí puedes agregar lógica adicional como navegación o analytics
  }
}