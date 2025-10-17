import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() title: string = 'No hay resultados';
  @Input() message: string = 'No se encontraron elementos';
  @Input() icon: string = 'fa-inbox';
  @Input() actionText?: string;
  @Input() actionRoute?: string;
  @Input() actionExternal?: string;
  @Input() minHeight: string = '400px';
}