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

  validateCheckout(request: CheckoutValidationRequest): Observable<CheckoutValidationResponse> {
    return this.api.post<CheckoutValidationResponse>('/checkout/validate', request).pipe(
      map((response: any) => {
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }

  calculateTotals(request: CheckoutCalculationRequest): Observable<CheckoutCalculationResponse> {
    return this.api.post<CheckoutCalculationResponse>('/checkout/calculate', request).pipe(
      map((response: any) => {
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>('/checkout/create-order', request).pipe(
      map((response: any) => {
        if (response.items !== undefined) {
          return response.items;
        }
        return response;
      })
    );
  }
}