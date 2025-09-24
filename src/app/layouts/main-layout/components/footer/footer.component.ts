import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();

  constructor(
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {}

}