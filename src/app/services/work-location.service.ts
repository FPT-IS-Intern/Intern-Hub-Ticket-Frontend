import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/ticket.model';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class WorkLocationService {
  private readonly baseUrl = `${environment.apiUrl}/hrm/work-locations`;

  constructor(private http: HttpClient) {}

  /**
   * Get all work locations
   * GET /hrm/work-locations/all-location
   * Returns a list of location name strings
   */
  getAllLocations(): Observable<ResponseApi<string[]>> {
    return this.http.get<ResponseApi<string[]>>(`${this.baseUrl}/all-location`);
  }
}
