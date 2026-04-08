import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { SnowflakeId } from '../core/type/snowflake-id';

// --- Interfaces ---

/** Dữ liệu trả về từ API first-three-registration-ticket (cũ) */
export interface RegistrationTicket {
    registrationDate: string;
    senderFullName: string;
    ticketStatus: string;
    department?: string;
    ticketTypeName?: string;
}

/** Dữ liệu 1 dòng bảng từ API POST /registration-ticket */
export interface RegistrationTicketRow {
    companyEmail: string;
    departmentName: string | null;
    fullName: string;
    no: number;
    ticketId: SnowflakeId;
    ticketStatus: string;
    ticketTypeName: string;
}

/** Dữ liệu chi tiết phiếu đăng ký */
export interface RegistrationTicketDetail {
    address: string;
    avatarUrl: string | null;
    companyEmail: string;
    cvUrl: string | null;
    dateOfBirth: string;
    fullName: string;
    idNumber: string;
    internshipEndDate: string;
    internshipStartDate: string;
    phoneNumber: string;
    positionName: string | null;
    sysStatus: string;
    userId: string;
}

/** Body request cho API POST /registration-ticket */
export interface TicketFilterRequest {
    keyword: string;
    ticketStatus: string;
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

export interface PaginatedData<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class HrmTicketService {
    private readonly apiUrl = `${environment.apiUrl}/hrm/ticket`;

    constructor(private http: HttpClient) { }

    // --- Stat-card APIs (trả về số) ---

    /** Tổng số phiếu cần duyệt */
    getApprovalCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/approval`);
    }

    /** Số phiếu đã duyệt */
    getApprovedCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/approved`);
    }

    /** Số phiếu chờ duyệt */
    getPendingCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/pending`);
    }

    /** Số phiếu từ chối */
    getRejectedCount(): Observable<ApiResponse<number>> {
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/rejected`);
    }

    // --- Table API ---

    /** Lấy danh sách phiếu đăng ký với filter + phân trang */
    getRegistrationTickets(
        filter: TicketFilterRequest,
        page: number,
        size: number
    ): Observable<ApiResponse<PaginatedData<RegistrationTicketRow>>> {
        return this.http.post<ApiResponse<PaginatedData<RegistrationTicketRow>>>(
            `${this.apiUrl}/registration-ticket?page=${page}&size=${size}`,
            filter
        );
    }

    /** Lấy chi tiết phiếu đăng ký theo ticketId */
    getRegistrationTicketDetail(ticketId: SnowflakeId): Observable<ApiResponse<RegistrationTicketDetail>> {
        return this.http.get<ApiResponse<RegistrationTicketDetail>>(`${this.apiUrl}/registration-ticket-detail/${ticketId}`);
    }

    // --- Approve / Reject ---

    /** Duyệt phiếu theo ticketId */
    approveTicket(ticketId: SnowflakeId, roleId: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/approve/${ticketId}`, { roleId });
    }

    /** Từ chối phiếu theo ticketId */
    rejectTicket(ticketId: SnowflakeId): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/reject/${ticketId}`, {});
    }

    /** Tạm ngưng phiếu theo ticketId */
    suspendTicket(ticketId: SnowflakeId): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/suspend/${ticketId}`, {});
    }

    // --- Legacy ---
    getFirstThreeRegistrationTickets(): Observable<ApiResponse<RegistrationTicket[]>> {
        return this.http.get<ApiResponse<RegistrationTicket[]>>(`${this.apiUrl}/first-three-registration-ticket`);
    }
}
