import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/ticket.model';
import { environment } from '../../environment/environment';

export interface BoPortalBranchResponse {
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
  private readonly boPortalBaseUrl = `${environment.apiUrl}/bo-portal/internal`;

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
   * Get all branches from BO Portal
   * GET /bo-portal/internal/branches
   */
  getAllBranches(): Observable<ResponseApi<BoPortalBranchResponse[]>> {
    return this.http.get<ResponseApi<BoPortalBranchResponse[]>>(`${this.boPortalBaseUrl}/branches`);
  }
}
