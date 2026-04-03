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
  TicketDetailResponse,
  ApproveTicketRequest,
  CreateTicketTypeRequest,
  TicketTypeResponse,
  FilterTicketRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreateTicketMultipartRequest,
  CreateTicketResponse,
  TicketManagementDto,
  StatCardData,
  UserTicketDto,
  BulkApproveTicketRequest,
  BulkApproveResponse,
  ApproverPermissionDto,
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
   * GET /ticket/ticket-types/all
   */
  getTicketTypes(): Observable<ResponseApi<TicketTypeDto[]>> {
    return this.http.get<ResponseApi<TicketTypeDto[]>>(`${this.baseUrl}/ticket-types/all`);
  }

  /**
   * Get stat card data (total, approved, pending, rejected)
   * GET /ticket/stat-card-data
   */
  getStatCardData(): Observable<ResponseApi<StatCardData>> {
    return this.http.get<ResponseApi<StatCardData>>(`${this.baseUrl}/stat-card-data`);
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
   * List all tickets for management page (admin) with full filter support.
   * Returns enriched data: fullName, email from HRM; typeName from TicketType.
   * GET /ticket/management/all
   */
  getAllTicketsForManagement(
    page: number = 0,
    size: number = 20,
    filter?: FilterTicketRequest
  ): Observable<ResponseApi<PaginatedData<TicketManagementDto>>> {
    let params: { [key: string]: string } = {
      page: page.toString(),
      size: size.toString(),
      sortBy: filter?.sortBy ?? 'createdAt',
      sortDirection: filter?.sortDirection ?? 'desc',
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
    if (filter?.startDate) {
      params['startDate'] = filter.startDate.toString();
    }
    if (filter?.endDate) {
      params['endDate'] = filter.endDate.toString();
    }

    return this.http.get<ResponseApi<PaginatedData<TicketManagementDto>>>(`${this.baseUrl}/management/all`, {
      params,
    });
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
    if (filter?.startDate) {
      params['startDate'] = filter.startDate.toString();
    }
    if (filter?.endDate) {
      params['endDate'] = filter.endDate.toString();
    }
    if (filter?.sortBy) {
      params['sortBy'] = filter.sortBy;
    }
    if (filter?.sortDirection) {
      params['sortDirection'] = filter.sortDirection;
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
   * @param ticketId - The ticket ID (Long in backend)
   */
  getTicketDetail(ticketId: string): Observable<ResponseApi<TicketDetailResponse>> {
    return this.http.get<ResponseApi<TicketDetailResponse>>(`${this.baseUrl}/${ticketId}`);
  }

  /**
   * Create a new ticket (JSON only, no files)
   * POST /ticket
   * Content-Type: application/json
   */
  createTicket(request: CreateTicketRequest): Observable<ResponseApi<TicketResponse>> {
    return this.http.post<ResponseApi<TicketResponse>>(`${this.baseUrl}`, request);
  }

  /**
   * Create a new ticket with multipart/form-data (files + JSON payload)
   * POST /ticket
   * Content-Type: multipart/form-data
   *
   * Backend expects:
   * - @RequestPart("request"): CreateTicketRequest (JSON)
   * - @RequestPart(value = "evidences", required = false): MultipartFile[] (files)
   *
   * @param request - CreateTicketMultipartRequest containing ticketTypeId and payload
   * @param evidences - Array of File objects for evidence attachments
   */
  createTicketMultipart(
    request: CreateTicketMultipartRequest,
    evidences: File[],
  ): Observable<ResponseApi<CreateTicketResponse>> {
    const formData = new FormData();

    // Append JSON request as "request" part (matches @RequestPart("request")).
    //
    // Use Blob({ type: 'application/json' }) — NOT a raw string and NOT Blob without type.
    //
    // Why Blob with explicit type:
    //   - Raw string  → browser/Axios infers Content-Type: application/octet-stream
    //                   → Spring throws "Content-Type 'application/octet-stream' is not supported"
    //   - Blob w/o type → browser sends Content-Type: application/octet-stream (same problem)
    //   - Blob({ type: 'application/json' }) → browser sends Content-Type: application/json
    //                   → Spring correctly deserializes the JSON body into CreateTicketRequest.
    //
    // The filename="blob" attribute that appears in Content-Disposition is intentional and
    // harmless in Spring Boot 3.x — RequestPartMethodArgumentResolver ignores it when
    // Content-Type is application/json and the body is valid JSON.
    //
    const requestJson = JSON.stringify({
      ticketTypeId: request.ticketTypeId,
      payload: request.payload,
    });
    formData.append('request', new Blob([requestJson], { type: 'application/json' }));

    // Append each evidence file as "evidences" part (matches @RequestPart(value = "evidences")).
    evidences.forEach((file) => {
      formData.append('evidences', file, file.name);
    });

    return this.http.post<ResponseApi<CreateTicketResponse>>(`${this.baseUrl}`, formData);
  }

  /**
   * Approve ticket
   * POST /ticket/{ticketId}/approve
   * @param ticketId - The ticket ID to approve (Long in backend)
   */
  approveTicket(
    ticketId: string,
    request: ApproveTicketRequest,
  ): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(`${this.baseUrl}/${ticketId}/approve`, request);
  }

  /**
   * Reject ticket
   * POST /ticket/{ticketId}/reject
   * @param ticketId - The ticket ID to reject (Long in backend)
   */
  rejectTicket(
    ticketId: string,
    request: ApproveTicketRequest,
  ): Observable<ResponseApi<void>> {
    return this.http.post<ResponseApi<void>>(`${this.baseUrl}/${ticketId}/reject`, request);
  }

  /**
   * Bulk approve tickets
   * POST /ticket/bulk-approve
   * @param request - BulkApproveTicketRequest containing idempotencyKey, tickets list, and optional comment
   */
  bulkApprove(request: BulkApproveTicketRequest): Observable<ResponseApi<BulkApproveResponse>> {
    return this.http.post<ResponseApi<BulkApproveResponse>>(`${this.baseUrl}/bulk-approve`, request);
  }

  /**
   * Get approvers by approval level
   * GET /ticket/approvers?level={level}
   */
  getApproversByLevel(level: number): Observable<ResponseApi<{ approverIds?: string[] } | string[]>> {
    return this.http.get<ResponseApi<{ approverIds?: string[] } | string[]>>(`${this.baseUrl}/approvers`, {
      params: { level: level.toString() },
    });
  }

  /**
   * Get approval permission of current user
   * GET /ticket/approvers/me
   */
  getMyApproverPermission(): Observable<ResponseApi<ApproverPermissionDto>> {
    return this.http.get<ResponseApi<ApproverPermissionDto>>(`${this.baseUrl}/approvers/me`);
  }

  /**
   * Upload evidence for a ticket
   * POST /ticket/{ticketId}/evidences
   * @param ticketId - The ticket ID (Long in backend)
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
   * GET /ticket/evidences/{ticketId}
   * @param ticketId - The ticket ID (Long in backend)
   */
  getEvidences(ticketId: string): Observable<ResponseApi<EvidenceDto[]>> {
    return this.http.get<ResponseApi<EvidenceDto[]>>(`${this.baseUrl}/evidences/${ticketId}`);
  }

  /**
   * Generate a presigned URL for uploading evidence file
   * POST /ticket/evidences/presigned-url
   */
  generatePresignedUrl(request: PresignedUrlRequest): Observable<ResponseApi<PresignedUrlResponse>> {
    return this.http.post<ResponseApi<PresignedUrlResponse>>(
      `${this.baseUrl}/evidences/presigned-url`,
      request,
    );
  }

  /**
   * Upload a file directly to the presigned URL (MinIO/S3)
   * Uses fetch instead of HttpClient to avoid interceptors/base URL
   */
  uploadFileToPresignedUrl(uploadUrl: string, file: File): Observable<void> {
    return new Observable<void>((observer) => {
      fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })
        .then((response) => {
          if (response.ok) {
            observer.next();
            observer.complete();
          } else {
            observer.error(new Error(`Upload failed with status ${response.status}`));
          }
        })
        .catch((err) => {
          observer.error(err);
        });
    });
  }

  /**
   * Get tickets for the current user
   * GET /ticket/me?typeName=...&status=...
   */
  getMyTickets(
    typeName?: string,
    status?: string,
  ): Observable<ResponseApi<UserTicketDto[]>> {
    const params: { [key: string]: string } = {};
    if (typeName) params['typeName'] = typeName;
    if (status) params['status'] = status;
    return this.http.get<ResponseApi<UserTicketDto[]>>(`${this.baseUrl}/me`, { params });
  }
}
