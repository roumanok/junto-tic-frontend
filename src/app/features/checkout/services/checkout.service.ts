// src/app/features/checkout/services/checkout.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  CheckoutValidationRequest,
  CheckoutValidationResponse,
  CheckoutCalculationRequest,
  CheckoutCalculationResponse,
  CreateOrderRequest,
  CreateOrderResponse
} from '../models/checkout.model';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private api = inject(ApiService);

  /**
   * Validar items del checkout
   */
  validateCheckout(request: CheckoutValidationRequest): Observable<CheckoutValidationResponse> {
    console.log('🔍 Validando checkout:', request);
    return this.api.post<CheckoutValidationResponse>('/checkout/validate', request).pipe(
      map((response: any) => {
        // Si la API devuelve ApiResponse<T>, extraer los datos
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }

  /**
   * Calcular totales del checkout
   */
  calculateTotals(request: CheckoutCalculationRequest): Observable<CheckoutCalculationResponse> {
    console.log('💰 Calculando totales:', request);
    return this.api.post<CheckoutCalculationResponse>('/checkout/calculate', request).pipe(
      map((response: any) => {
        // Si la API devuelve ApiResponse<T>, extraer los datos
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }

  /**
   * Crear orden completa
   */
  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    console.log('📦 Creando orden:', request);
    return this.api.post<CreateOrderResponse>('/checkout/create-order', request).pipe(
      map((response: any) => {
        // Si la API devuelve ApiResponse<T>, extraer los datos
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }
}