import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  items: T;
  message?: string;
  success: boolean;
}

export type ApiSimpleResponse<T>  = T;

export type ApiSimpleListResponse<T>  = T[];

export interface ApiPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {    
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

   getSimple<T>(endpoint: string, params?: HttpParams): Observable<ApiSimpleResponse<T>> {
    return this.http.get<ApiSimpleResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
    .pipe(
        catchError(this.handleError)
    );
  }

  getSimpleList<T>(endpoint: string, params?: HttpParams): Observable<ApiSimpleListResponse<T>> {
    return this.http.get<ApiSimpleListResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
    .pipe(
        catchError(this.handleError)
    );
  }

  getPaginated<T>(endpoint: string, params?: HttpParams): Observable<ApiPaginatedResponse<T>> {
    return this.http.get<ApiPaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
    .pipe(
        catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
    .pipe(
        catchError(this.handleError)
    );
  }

  postWithOptions<T>(endpoint: string, body: any, options?: any): Observable<HttpEvent<T>> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options)
    .pipe(
        catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
    .pipe(
        catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
    .pipe(
        catchError(this.handleError)
    );
  } 

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';    
    if (error.error instanceof ErrorEvent) {      
      errorMessage = `Error de cliente: ${error.error.message}`;
    } else {      
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar al servidor. Verifica que esté corriendo';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }    
    console.error('❌ API Error:', errorMessage, error);
    return throwError(() => errorMessage);
  }
}