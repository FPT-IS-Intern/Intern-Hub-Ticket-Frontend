import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/ticket.model';
import { environment } from '../../environment/environment';

export interface PositionListResponse {
  positionId: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private readonly baseUrl = `${environment.apiUrl}/hrm/users/positions`;

  constructor(private http: HttpClient) {}

  /**
   * List all positions
   * GET /hrm/users/positions
   */
  listAllPositions(): Observable<ResponseApi<PositionListResponse[]>> {
    return this.http.get<ResponseApi<PositionListResponse[]>>(this.baseUrl);
  }
}
