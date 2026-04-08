import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface RegisterUserRequest {
  email: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  positionCode: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
}

export interface ResponseApi<T> {
  status?: {
    code?: string | number;
    message?: string;
    errors?: any;
  } | null;
  code?: number;
  message?: string;
  data: T;
  metaData?: any;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  positionCode: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  sysStatus: string;
}

export interface PositionResponse {
  name: string;
  positionId: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface SupervisorResponse {
  avatarUrl: string | null;
  fullName: string;
  nickName: string;
  role: string | null;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/hrm/users`;

  constructor(private http: HttpClient) { }

  getPositions(): Observable<ResponseApi<PositionResponse[]>> {
    return this.http.get<ResponseApi<PositionResponse[]>>(`${this.baseUrl}/positions`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRoles(): Observable<ResponseApi<RoleResponse[]>> {
    return this.http.get<ResponseApi<RoleResponse[]>>(`${this.baseUrl}/roles`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getSupervisors(): Observable<ResponseApi<SupervisorResponse[]>> {
    return this.http.get<ResponseApi<SupervisorResponse[]>>(`${this.baseUrl}/supervisor`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  assignUserRole(userId: string, roleId: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/auth/authz/users/${userId}/role`,
      { roleId }
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRolesByUserId(userId: string): Observable<ResponseApi<RoleResponse[]>> {
    return this.http.get<ResponseApi<RoleResponse[]>>(
      `${environment.apiUrl}/auth/authz/users/${userId}/roles`
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRoleNameByUserId(userId: string): Observable<string> {
    return this.getRolesByUserId(userId).pipe(
      map((response) => response.data?.[0]?.name || '')
    );
  }

  /**
   * Register a new user with multipart form data
   * Backend expects:
   * - @RequestPart("userInfo") RegisterUserRequest
   * - @RequestPart("avatarFile") MultipartFile
   * - @RequestPart("cvFile") MultipartFile
   */
  registerUser(
    userInfo: RegisterUserRequest,
    avatarFile: File,
    cvFile: File
  ): Observable<ResponseApi<UserResponse>> {
    const formData = new FormData();

    // Append userInfo as JSON Blob with content-type application/json
    // IMPORTANT: filename 'userInfo.json' is required for Spring Boot @RequestPart to deserialize the JSON part
    const userInfoBlob = new Blob([JSON.stringify(userInfo)], {
      type: 'application/json'
    });
    formData.append('userInfo', userInfoBlob);

    // Append files
    formData.append('avatarFile', avatarFile, avatarFile.name);
    formData.append('cvFile', cvFile, cvFile.name);

    return this.http.post<ResponseApi<UserResponse>>(
      `${this.baseUrl}/register`,
      formData
    ).pipe(
      catchError((error) => {
        // If /hrm/users/register fails with 404, try /users/register as fallback
        if (error.status === 404) {
          console.warn('Retrying register with fallback URL...');
          const fallbackUrl = `${environment.apiUrl}/users/register`;
          return this.http.post<ResponseApi<UserResponse>>(fallbackUrl, formData).pipe(
            catchError(() => this.handleError(error))
          );
        }
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Prioritize backend messages
      // Ưu tiên field 'code' trong status vì nó chứa thông báo lỗi tiếng Việt chi tiết từ backend
      if (error.error?.status?.code && typeof error.error.status.code === 'string' && error.error.status.code.length > 5) {
        errorMessage = error.error.status.code;
      } else if (error.error?.status?.message) {
        errorMessage = error.error.status.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        // Fallback to defaults
        if (error.status === 0) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (error.status === 400) {
          errorMessage = 'Dữ hiệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.status === 409) {
          errorMessage = 'Dữ liệu đã tồn tại hoặc có xung đột (409).';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        }
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

