import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTicketRequest,
  TicketResponse,
  ResponseApi,
  TicketTypeDto,
  UploadEvidenceRequest,
  EvidenceDto,
  TicketDto,
  PaginatedData,
  TicketDetailDto,
  ApproveTicketRequest,
  CreateTicketTypeRequest,
  TicketTypeResponse,
  FilterTicketRequest,
} from '../models/ticket.model';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly baseUrl = `${environment.apiUrl}/ticket`;

  constructor(private http: HttpClient) {}

  /**
   * List active ticket types
   * GET
   * /ticket/ticket-types/all
   */
  getTicketTypes(): Observable<ResponseApi<TicketTypeDto[]>> {
    return this.http.get<ResponseApi<TicketTypeDto[]>>(`${this.baseUrl}/ticket-types/all`);
  }

  /**
   * Create ticket type (admin)
   * POST /ticket/types
   */
  createTicketType(
    request: CreateTicketTypeRequest,
  ): Observable<ResponseApi<TicketTypeResponse>> {
    return this.http.post<ResponseApi<TicketTypeResponse>>(
      `${this.baseUrl}/types`,
      request,
    );
  }

  /**
   * List all tickets (paginated + filter)
   * GET /ticket/all
   */
  getAllTickets(
    page: number = 0,
    size: number = 20,
    filter?: FilterTicketRequest
  ): Observable<ResponseApi<PaginatedData<TicketDto>>> {
    let params: { [key: string]: string } = {
      page: page.toString(),
      size: size.toString(),
    };

    if (filter?.nameOrEmail) {
      params['nameOrEmail'] = filter.nameOrEmail;
    }
    if (filter?.typeName) {
      params['typeName'] = filter.typeName;
    }
    if (filter?.status) {
      params['status'] = filter.status;
    }

    return this.http.get<ResponseApi<PaginatedData<TicketDto>>>(`${this.baseUrl}/all`, {
      params,
    });
  }

  /**
   * List pending tickets
   * GET /ticket/pending
   */
  getPendingTickets(page: number = 0, size: number = 20): Observable<ResponseApi<TicketDto[]>> {
    return this.http.get<ResponseApi<TicketDto[]>>(`${this.baseUrl}/pending`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  /**
   * Get ticket detail
   * GET /ticket/{ticketId}
   */
  getTicketDetail(ticketId: string): Observable<ResponseApi<TicketDetailDto>> {
    return this.http.get<ResponseApi<TicketDetailDto>>(`${this.baseUrl}/${ticketId}`);
  }

  /**
   * Create a new ticket
   * POST /ticket
   */
  createTicket(request: CreateTicketRequest): Observable<ResponseApi<TicketResponse>> {
    return this.http.post<ResponseApi<TicketResponse>>(`${this.baseUrl}`, request);
  }

  /**
   * Approve ticket
   * POST /ticket/{ticketId}/approve
   */
  approveTicket(
    ticketId: string,
    request: ApproveTicketRequest,
  ): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(`${this.baseUrl}/${ticketId}/approve`, request);
  }

  /**
   * Upload evidence for a ticket
   * POST /ticket/{ticketId}/evidences
   */
  uploadEvidence(
    ticketId: string,
    request: UploadEvidenceRequest,
  ): Observable<ResponseApi<EvidenceDto>> {
    return this.http.post<ResponseApi<EvidenceDto>>(
      `${this.baseUrl}/${ticketId}/evidences`,
      request,
    );
  }

  /**
   * List evidences for a ticket
   * GET /ticket/{ticketId}/evidences
   */
  getEvidences(ticketId: string): Observable<ResponseApi<EvidenceDto[]>> {
    return this.http.get<ResponseApi<EvidenceDto[]>>(`${this.baseUrl}/${ticketId}/evidences`);
  }
}
