import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface AttendanceFilterResponse {
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  companyEmail: string;
  fullName: string;
  no: number | null;
  status: string;
  workLocation: string | null;
  workingMethod: string;
}

export interface AttendanceFilterRequest {
  nameOrKeyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface AttendanceStatisticGraphRequest {
  fromDate: string;
  toDate: string;
}

export interface AttendanceStatisticGraphData {
  onTimePercentage: number | string;
  latePercentage: number | string;
  absentPercentage: number | string;
}

export interface AttendanceSectionData {
  absentWithLicense: number;
  absentWithoutLicense: number;
  totalLateDate: number;
  totalWorkDate: number;
}

export interface AttendancePaginatedData<T> {
  items: T[];
  totalItems: number | string;
  totalPages: number;
}

export interface AttendanceResponseApi<T> {
  status?: { code?: string; message?: string; errors?: any } | null;
  data: T;
  metaData?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceManagementService {
  private readonly baseUrl = `${environment.apiUrl}/hrm/attendance`;

  constructor(private http: HttpClient) {}

  /**
   * Filter attendance logs
   * Backend: POST /hrm/attendance/filter
   * Request body: { nameOrEmail, startDate, endDate, attendanceStatus }
   */
  filterAttendance(
    request: AttendanceFilterRequest,
    page: number = 0,
    size: number = 10
  ): Observable<AttendanceResponseApi<AttendancePaginatedData<AttendanceFilterResponse>>> {
    const body: AttendanceFilterRequest = {
      nameOrKeyword: request.nameOrKeyword && request.nameOrKeyword.trim() ? request.nameOrKeyword.trim() : "",
      startDate: request.startDate ? request.startDate : "",
      endDate: request.endDate ? request.endDate : "",
      status: request.status ? request.status : ""
    };

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .post<AttendanceResponseApi<AttendancePaginatedData<AttendanceFilterResponse>>>(
        `${this.baseUrl}/filter`,
        body,
        { params }
      )
      .pipe(catchError(this.handleError));
  }

  getAttendanceStatisticGraph(
    request: AttendanceStatisticGraphRequest
  ): Observable<AttendanceStatisticGraphData> {
    return this.http
      .post<AttendanceResponseApi<AttendanceStatisticGraphData>>(
        `${this.baseUrl}/attendance-statistic-graph`,
        request
      )
      .pipe(
        map((res) =>
          res?.data ?? {
            onTimePercentage: 0,
            latePercentage: 0,
            absentPercentage: 0,
          }
        ),
        catchError(this.handleError)
      );
  }

  getAttendancePercentages(
    fromDate: Date | null,
    toDate: Date | null
  ): Observable<{ onTime: number; late: number; absent: number }> {
    const today = new Date();
    const request: AttendanceStatisticGraphRequest = {
      fromDate: this.formatDateForApi(fromDate ?? today),
      toDate: this.formatDateForApi(toDate ?? today),
    };

    return this.getAttendanceStatisticGraph(request).pipe(
      map((data) => ({
        onTime: this.parsePercentage(data.onTimePercentage),
        late: this.parsePercentage(data.latePercentage),
        absent: this.parsePercentage(data.absentPercentage),
      }))
    );
  }

  getAttendanceSection(): Observable<AttendanceSectionData> {
    return this.http
      .get<AttendanceResponseApi<AttendanceSectionData>>(
        `${this.baseUrl}/attendance-section`
      )
      .pipe(
        map((res) => this.normalizeAttendanceSectionData(res?.data)),
        catchError(this.handleError)
      );
  }

  getAttendanceSectionByUserId(userId: string): Observable<AttendanceSectionData> {
    return this.http
      .get<AttendanceResponseApi<AttendanceSectionData>>(
        `${this.baseUrl}/attendance-section/${userId}`
      )
      .pipe(
        map((res) => this.normalizeAttendanceSectionData(res?.data)),
        catchError(this.handleError)
      );
  }

  private normalizeAttendanceSectionData(
    data: Partial<AttendanceSectionData> | null | undefined
  ): AttendanceSectionData {
    return {
      absentWithLicense: this.parseNumber(data?.absentWithLicense),
      absentWithoutLicense: this.parseNumber(data?.absentWithoutLicense),
      totalLateDate: this.parseNumber(data?.totalLateDate),
      totalWorkDate: this.parseNumber(data?.totalWorkDate),
    };
  }

  private parseNumber(value: number | string | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parsePercentage(value: number | string | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy dữ liệu chấm công.';
    } else if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.error?.status?.code && typeof error.error.status.code === 'string' && error.error.status.code.length > 5) {
      errorMessage = error.error.status.code;
    } else if (error.error?.status?.message) {
      errorMessage = error.error.status.message;
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    }

    console.error('Attendance API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
