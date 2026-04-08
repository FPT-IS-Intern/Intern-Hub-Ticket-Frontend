import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

// --- Interfaces ---

/** Dữ liệu 1 dòng bảng từ API first-three-leave-tickets, first-three-explanation-tickets, first-three-remote-tickets */
export interface TicketRow {
    ticketId: string;
    createdAt: string;
    fullName: string;
    status: string;
}

export interface DashboardManagementTicket {
  ticketId: string;
  fullName: string;
  status: string;
  createdAt: number;
}

export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

/** Response chung */
export interface ApiResponse<T> {
    status: {
        code: string;
        message: string | null;
        errors: string | null;
    };
    data: T;
    metaData: {
        requestId: string;
        traceId: string;
        signature: string | null;
        timestamp: number;
    };
}

export interface TicketStatisticData {
  workFromHome: number;
  workOffSite: number;
  workOnSite: number;
}

export interface TicketStatisticResponse {
  status: {
    code: string;
    message: string | null;
    errors: string | null;
  };
  data: TicketStatisticData;
  metaData: {
    requestId: string;
    traceId: string;
    signature: string | null;
    timestamp: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HrmTicketStatisticService {
  private readonly baseUrl = `${environment.apiUrl}/ticket`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy thống kê nơi làm việc
   * Backend: GET /hrm/ticket/ticket-statistic
   */
  getTicketStatistic(): Observable<TicketStatisticResponse> {
    return this.http.get<TicketStatisticResponse>(
      `${this.baseUrl}/ticket-statistic`
    ).pipe(catchError(this.handleError));
  }

  // --- First-three ticket APIs (dashboard cards) ---

  getFirstThreeLeaveTickets(): Observable<ApiResponse<TicketRow[]>> {
    return this.http.get<ApiResponse<TicketRow[]>>(`${this.baseUrl}/me/first-three-leave-tickets`);
  }

  getFirstThreeExplanationTickets(): Observable<ApiResponse<TicketRow[]>> {
    return this.http.get<ApiResponse<TicketRow[]>>(`${this.baseUrl}/me/first-three-explanation-tickets`);
  }

  getFirstThreeRemoteTickets(): Observable<ApiResponse<TicketRow[]>> {
    return this.http.get<ApiResponse<TicketRow[]>>(`${this.baseUrl}/me/first-three-remote-tickets`);
  }

  getManagementTicketsByType(
    typeName: string,
    page = 0,
    size = 100,
  ): Observable<ApiResponse<PaginatedData<DashboardManagementTicket>>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('typeName', typeName)
      .set('sortBy', 'createdAt')
      .set('sortDirection', 'desc');

    return this.http.get<ApiResponse<PaginatedData<DashboardManagementTicket>>>(
      `${this.baseUrl}/management/all`,
      { params },
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy dữ liệu.';
    } else if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.error?.status?.message) {
      errorMessage = error.error.status.message;
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    }

    console.error('TicketStatistic API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
