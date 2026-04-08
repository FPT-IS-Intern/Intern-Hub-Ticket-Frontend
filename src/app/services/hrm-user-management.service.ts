import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environment/environment';

// Backend FilterRequest structure
export interface FilterRequest {
  keyword?: string;
  sysStatuses?: string[];  // List<UserStatus> - e.g., ['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED']
  roles?: string[];        // List<String> role ids or names from backend role API
  positions?: string[];    // List<String> position names from backend position API
}

// Backend FilterResponse structure
export interface FilterResponse {
  userId: string;          // User ID as string for large numbers
  no?: number;             // STT
  avatarUrl?: string | null;
  fullName: string;
  sysStatus: string;
  email?: string;
  companyEmail?: string;
  role?: string;
  position?: string;
  positionCode?: string;
}

// Full user response for other APIs
export interface UserResponse {
  userId: string;           // User ID as string for large numbers
  avatarUrl?: string | null;
  idNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;      // Format: "2003-05-10"
  positionCode: string;
  cvUrl?: string | null;
  superVisorName?: string | null;
  superVisorId?: string | null;
  internshipStartDate?: string | null;
  internshipEndDate?: string | null;
  sysStatus: string;           // APPROVED, PENDING, REJECTED, SUSPENDED
}

// Backend response structure
export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export interface ResponseApi<T> {
  status?: {
    code?: string | number;
    message?: string;
    errors?: any;
  } | null;
  code?: number;      // Some APIs use code directly
  message?: string;   // Some APIs use message directly
  data: T;
  metaData?: any;
}

// Update profile request payload (matches backend UpdateProfileRequest)
export interface UpdateProfilePayload {
  fullName?: string;
  companyEmail?: string;
  dateOfBirth?: string;    // ISO format: yyyy-MM-dd (LocalDate)
  idNumber?: string;       // CCCD
  address?: string;
  phoneNumber?: string;
  position?: string | null;    // positionId (Long) - chỉ STAFF mới gửi
  sysStatus?: string | null;   // APPROVED | SUSPENDED - chỉ STAFF mới gửi
  role?: string | null;        // roleId (String) - chỉ STAFF mới gửi
  internshipStartDate?: string;  // ISO format: yyyy-MM-dd
  internshipEndDate?: string;    // ISO format: yyyy-MM-dd
}

export interface QuickNoteResponse {
  createDate: string;  // LocalDate from backend
  content: string;
}

export interface SupervisorMemberResponse {
  avatarUrl: string | null;
  companyEmail: string;
  fullName: string;
  no: number;
  position: string;
  role: string | null;
  sysStatus: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HrmUserManagementService {
  private readonly baseUrl = `${environment.apiUrl}/hrm/users`;
  private readonly quickNoteUrl = `${environment.apiUrl}/hrm/quickly-note`;

  constructor(private http: HttpClient) { }

  /**
   * Filter users by keyword, sysStatuses, roles, or positions
   * Backend: POST /hrm/api/users/filter
   * @RequestBody FilterRequest { keyword, sysStatuses, roles, positions }
   */
  filterUsers(request: FilterRequest, page: number = 0, size: number = 10): Observable<ResponseApi<PaginatedData<FilterResponse>>> {
    // Clean up request - remove undefined/null/empty values
    const cleanRequest: FilterRequest = {};

    if (request.keyword && request.keyword.trim()) {
      cleanRequest.keyword = request.keyword.trim();
    }
    if (request.sysStatuses && request.sysStatuses.length > 0) {
      cleanRequest.sysStatuses = request.sysStatuses;
    }
    if (request.roles && request.roles.length > 0) {
      cleanRequest.roles = request.roles;
    }
    if (request.positions && request.positions.length > 0) {
      cleanRequest.positions = request.positions;
    }

    console.log('Filter request:', cleanRequest);

    const params = { page: page.toString(), size: size.toString() };

    return this.http.post<ResponseApi<PaginatedData<FilterResponse>>>(`${this.baseUrl}/filter`, cleanRequest, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user profile (using current token)
   * Backend: GET /hrm/api/users/profile
   */
  getMyProfile(): Observable<ResponseApi<UserResponse>> {
    return this.http.get<ResponseApi<UserResponse>>(`${this.baseUrl}/profile`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user profile
   * Backend: GET /hrm/api/users/profile/{userId}
   */
  getUserProfile(id: string): Observable<ResponseApi<UserResponse>> {
    return this.http.get<ResponseApi<UserResponse>>(`${this.baseUrl}/admin/profile/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Approve user
   * Backend: PUT /hrm/api/users/approval/{userId}
   */
  approveUser(id: number): Observable<ResponseApi<string>> {
    return this.http.put<ResponseApi<string>>(`${this.baseUrl}/approval/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Reject user
   * Backend: PUT /hrm/api/users/rejection/{userId}
   */
  rejectUser(id: number): Observable<ResponseApi<string>> {
    return this.http.put<ResponseApi<string>>(`${this.baseUrl}/rejection/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Suspend user
   * Backend: PUT /hrm/api/users/suspension/{userId}
   */
  suspendUser(id: number): Observable<ResponseApi<UserResponse>> {
    return this.http.put<ResponseApi<UserResponse>>(`${this.baseUrl}/suspension/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Lấy tổng số thực tập sinh
   * Backend: GET /hrm/users/total-intern
   */
  getTotalIntern(): Observable<ResponseApi<number>> {
    return this.http.get<ResponseApi<number>>(`${this.baseUrl}/total-intern`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Lấy thông tin biến động thực tập sinh so với tháng trước
   * Backend: GET /hrm/users/internship-changing
   */
  getInternshipChanging(): Observable<ResponseApi<string>> {
    return this.http.get<ResponseApi<string>>(`${this.baseUrl}/internship-changing`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Assign mentor to user
   * Backend: PATCH /hrm/users/assign-mentor/{userId}/{mentorId}
   */
  assignMentor(userId: string, mentorId: string): Observable<ResponseApi<any>> {
    return this.http.patch<ResponseApi<any>>(`${this.baseUrl}/assign-mentor/${userId}/${mentorId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Update user profile
   * Backend: PATCH /hrm/users/me/profile
   * Content-Type: multipart/form-data
   * UserId is resolved server-side from auth context (UserContext.requiredUserId())
   * @RequestPart("userInfo") UpdateProfileRequest  - JSON (required)
   * @RequestPart("cvFile") MultipartFile (optional)
   * @RequestPart("avatarFile") MultipartFile (optional)
   */
  updateUserProfile(
    userInfo: UpdateProfilePayload,
    cvFile?: File | null,
    avatarFile?: File | null
  ): Observable<ResponseApi<string>> {
    const formData = new FormData();

    // Append userInfo as JSON Blob (required by backend @RequestPart)
    const userInfoBlob = new Blob([JSON.stringify(userInfo)], { type: 'application/json' });
    formData.append('userInfo', userInfoBlob);

    // Append files only when provided (backend marks them required=false)
    if (cvFile && cvFile instanceof File) {
      formData.append('cvFile', cvFile, cvFile.name);
    }

    if (avatarFile && avatarFile instanceof File) {
      formData.append('avatarFile', avatarFile, avatarFile.name);
    }

    return this.http.patch<ResponseApi<string>>(
      `${this.baseUrl}/me/profile`,
      formData
    ).pipe(catchError(this.handleError));
  }

  /**
   * Admin update a specific user's profile
   * Backend: PATCH /hrm/users/profile/{userId}
   * Content-Type: multipart/form-data
   * @RequestPart("userInfo") UpdateProfileRequest  - JSON (required)
   * @RequestPart("cvFile") MultipartFile (optional)
   * @RequestPart("avatarFile") MultipartFile (optional)
   */
  adminUpdateUserProfile(
    userId: string,
    userInfo: UpdateProfilePayload,
    cvFile?: File | null,
    avatarFile?: File | null
  ): Observable<ResponseApi<string>> {
    const formData = new FormData();

    const userInfoBlob = new Blob([JSON.stringify(userInfo)], { type: 'application/json' });
    formData.append('userInfo', userInfoBlob);

    if (cvFile && cvFile instanceof File) {
      formData.append('cvFile', cvFile, cvFile.name);
    }

    if (avatarFile && avatarFile instanceof File) {
      formData.append('avatarFile', avatarFile, avatarFile.name);
    }

    return this.http.patch<ResponseApi<string>>(
      `${this.baseUrl}/profile/${userId}`,
      formData
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get quick notes for a specific user (admin)
   * Backend: GET /hrm/quickly-note/{userId}
   */
  getQuickNotes(userId: string): Observable<ResponseApi<QuickNoteResponse[]>> {
    return this.http.get<ResponseApi<QuickNoteResponse[]>>(`${this.quickNoteUrl}/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create quick note for a specific user (admin)
   * Backend: POST /hrm/quickly-note/{userId}
   */
  createQuickNote(userId: string, content: string): Observable<ResponseApi<any>> {
    return this.http.post<ResponseApi<any>>(`${this.quickNoteUrl}/${userId}`, { content })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get quick notes for current user
   * Backend: GET /hrm/quickly-note
   */
  getMyQuickNotes(): Observable<ResponseApi<QuickNoteResponse[]>> {
    return this.http.get<ResponseApi<QuickNoteResponse[]>>(this.quickNoteUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all members managed by a supervisor
   * - Without userId: GET /hrm/users/supervisor/members  (my-profile — current user)
   * - With userId:    GET /hrm/users/supervisor/members/{userId}  (user-profile — specific supervisor)
   */
  getSupervisorMembers(userId?: string): Observable<ResponseApi<SupervisorMemberResponse[]>> {
    const url = userId
      ? `${this.baseUrl}/members/${userId}`
      : `${this.baseUrl}/members`;
    return this.http.get<ResponseApi<SupervisorMemberResponse[]>>(url)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    // Prioritize status codes for specific common errors
    if (error.status === 409) {
      errorMessage = 'Thông tin đã tồn tại hoặc không có thay đổi mới nào được phát hiện.';
    } else if (error.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy người dùng.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Fallback to backend error message
      // Ưu tiên field 'code' trong status vì nó chứa thông báo lỗi tiếng Việt chi tiết từ backend
      if (error.error?.status?.code && typeof error.error.status.code === 'string' && error.error.status.code.length > 5) {
        errorMessage = error.error.status.code;
      } else if (error.error?.status?.message) {
        errorMessage = error.error.status.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ.';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

