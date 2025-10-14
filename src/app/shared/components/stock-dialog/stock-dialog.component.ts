import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface StockDialogData {
  mode: 'add' | 'update';
  currentStock: number;
  listingTitle: string;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'add' ? 'Agregar Stock' : 'Actualizar Stock' }}
    </h2>
    
    <mat-dialog-content>
      <p class="listing-title">{{ data.listingTitle }}</p>
      
      @if (data.mode === 'update') {
        <p class="current-stock">Stock actual: <strong>{{ data.currentStock }}</strong></p>
      }

      <form [formGroup]="stockForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>
            {{ data.mode === 'add' ? 'Cantidad a agregar' : 'Nuevo stock' }}
          </mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="quantity"
            min="0"
            [placeholder]="data.mode === 'add' ? 'Ej: 10' : 'Ej: 25'">
          @if (stockForm.get('quantity')?.hasError('required')) {
            <mat-error>Este campo es requerido</mat-error>
          }
          @if (stockForm.get('quantity')?.hasError('min')) {
            <mat-error>Debe ser un número positivo</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'add' && stockForm.get('quantity')?.value) {
          <p class="stock-preview">
            Stock resultante: <strong>{{ data.currentStock + (stockForm.get('quantity')?.value || 0) }}</strong>
          </p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary"
        [disabled]="!stockForm.valid"
        (click)="onConfirm()">
        {{ data.mode === 'add' ? 'Agregar' : 'Actualizar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      padding: 20px 0;
    }

    .listing-title {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .current-stock {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      margin: 0 0 20px 0;

      strong {
        color: #1976d2;
        font-size: 16px;
      }
    }

    .full-width {
      width: 100%;
    }

    .stock-preview {
      margin: 16px 0 0 0;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);

      strong {
        color: #1976d2;
        font-size: 16px;
      }
    }

    mat-dialog-actions {
      padding: 8px 0;
      gap: 8px;
    }
  `]
})
export class StockDialogComponent {
  data = inject<StockDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<StockDialogComponent>);
  private fb = inject(FormBuilder);

  stockForm: FormGroup;

  constructor() {
    const initialValue = this.data.mode === 'update' ? this.data.currentStock : 0;
    
    this.stockForm = this.fb.group({
      quantity: [initialValue, [Validators.required, Validators.min(0)]]
    });
  }

  onConfirm(): void {
    if (this.stockForm.valid) {
      this.dialogRef.close(this.stockForm.get('quantity')?.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}