import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTicketRequest } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly baseUrl = '/ticket'; // Replace with real base_url if different

  constructor(private http: HttpClient) {}

  /**
   * Create a new ticket
   * @param request The ticket creation request
   */
  createTicket(request: CreateTicketRequest): Observable<any> {
    // API endpoint: POST /ticket
    return this.http.post<any>(`${this.baseUrl}`, request);
  }

  /**
   * List active ticket types
   * @returns Observable of TicketTypeDto[]
   */
  getTicketTypes(): Observable<any> {
    // API endpoint: GET /ticket/ticket-types
    return this.http.get<any>(`${this.baseUrl}/ticket-types`);
  }

  /**
   * Upload evidence for a ticket
   * @param ticketId The ID of the ticket
   * @param evidenceData The evidence upload request
   */
  uploadEvidence(ticketId: string, evidenceData: any): Observable<any> {
    // API endpoint: POST /ticket/{ticketId}/evidences
    return this.http.post<any>(`${this.baseUrl}/${ticketId}/evidences`, evidenceData);
  }
}
