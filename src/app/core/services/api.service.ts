import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params });
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }

  getSimple<T>(endpoint: string, params?: HttpParams): Observable<ApiSimpleResponse<T>> {
    return this.http.get<ApiSimpleResponse<T>>(`${this.baseUrl}${endpoint}`, { params });
  }

  getSimpleList<T>(endpoint: string, params?: HttpParams): Observable<ApiSimpleListResponse<T>> {
    return this.http.get<ApiSimpleListResponse<T>>(`${this.baseUrl}${endpoint}`, { params });
  }

  getPaginated<T>(endpoint: string, params?: HttpParams): Observable<ApiPaginatedResponse<T>> {
    return this.http.get<ApiPaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params });
  }
}