import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/ticket.model';
import { environment } from '../../environment/environment';

export interface TicketBranchResponse {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean | null;
}

@Injectable({
  providedIn: 'root',
})
export class WorkLocationService {
  private readonly hrmBaseUrl = `${environment.apiUrl}/hrm/work-locations`;
  private readonly ticketBaseUrl = `${environment.apiUrl}/ticket`;

  constructor(private http: HttpClient) {}

  /**
   * Get all work locations
   * GET /hrm/work-locations/all-location
   * Returns a list of location name strings
   */
  getAllLocations(): Observable<ResponseApi<string[]>> {
    return this.http.get<ResponseApi<string[]>>(`${this.hrmBaseUrl}/all-location`);
  }

  /**
   * Get all branches from Ticket Service
   * GET /ticket/branches
   */
  getAllBranches(): Observable<ResponseApi<TicketBranchResponse[]>> {
    return this.http.get<ResponseApi<TicketBranchResponse[]>>(`${this.ticketBaseUrl}/branches`);
  }
}

