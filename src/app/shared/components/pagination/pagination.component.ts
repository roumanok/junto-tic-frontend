import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() itemsPerPage = 20;
  @Input() maxVisiblePages = 5;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() showPageSizeSelector = false;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  visiblePages: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage'] || changes['totalPages'] || changes['maxVisiblePages']) {
      this.calculateVisiblePages();
    }
  }

  private calculateVisiblePages(): void {
    const pages: number[] = [];
    
    if (this.totalPages <= this.maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calcular el rango de páginas a mostrar
      let start = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
      let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);
      
      // Ajustar si estamos cerca del final
      if (end - start + 1 < this.maxVisiblePages) {
        start = Math.max(1, end - this.maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    this.visiblePages = pages;
  }

  onPageClick(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPrevious(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNext(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onFirst(): void {
    if (this.currentPage !== 1) {
      this.pageChange.emit(1);
    }
  }

  onLast(): void {
    if (this.currentPage !== this.totalPages) {
      this.pageChange.emit(this.totalPages);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }

  get showFirst(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 1;
  }

  get showLast(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}