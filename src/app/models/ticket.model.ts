export enum TicketStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum EvidenceStatus {
  UPLOADED = 'UPLOADED',
  DELETED = 'DELETED',
  PENDING = 'PENDING',
}

export interface TicketTypeDto {
  ticketTypeId: string;
  typeName: string;
  description: string | null;
}

export interface CreateTicketTypeRequest {
  typeName: string;
  description?: string;
}

export interface TicketTypeResponse {
  ticketTypeId: string;
  typeName: string;
}

export interface TicketDto {
  ticketId: string;
  userId: string;
  ticketTypeId: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface TicketDetailDto extends TicketDto {
  payload: Record<string, any>;
  requiredApprovals: number;
  currentApprovalLevel: number;
  approverId: string | null;
}

/**
 * DTO dành cho trang Quản lý phiếu yêu cầu (admin).
 * Backend trả về đã enrich fullName, email (từ HRM) và typeName (từ TicketType).
 */
export interface TicketManagementDto {
  ticketId: string;
  userId: string;
  fullName: string;
  email: string;
  ticketTypeId: string;
  typeName: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export interface EvidenceRequestItem {
  tempKey: string;
  destinationPath: string;
  fileType: string;
  fileSize: number;
}

/**
 * CreateTicketRequest: For non-multipart submission (JSON only)
 * Matches backend CreateTicketRequest DTO
 */
export interface CreateTicketRequest {
  ticketTypeId: string;
  payload: Record<string, any>;
}

/**
 * CreateTicketMultipartRequest: For multipart/form-data submission with file uploads
 * The evidences files are passed separately to the service method
 */
export interface CreateTicketMultipartRequest {
  ticketTypeId: string;
  payload: Record<string, any>;
}

export interface CreateTicketResponse {
  ticketId: string;
  status: TicketStatus;
}

export interface PresignedUrlRequest {
  fileName: string;
  destinationPath: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  tempKey: string;
}

export interface TicketResponse {
  ticketId: string;
  status: TicketStatus;
}

export interface ApproveTicketRequest {
  comment?: string;
  idempotencyKey: string;
  version: number;
}

export interface FilterTicketRequest {
  nameOrEmail?: string;
  typeName?: string;
  status?: string;
  startDate?: number;   // timestamp ms
  endDate?: number;     // timestamp ms
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'typeName';
  sortDirection?: 'asc' | 'desc';
}

export interface FilterStatsResponse {
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  rejectedItems: number;
}

export interface UploadEvidenceRequest {
  evidenceKey: string;
  fileType: string;
  fileSize: number;
}

export interface EvidenceDto {
  id: string;
  ticketId: string;
  evidenceFolder: string;
  evidenceUrl: string;
  fileType: string;
  fileSize: number;
  status: EvidenceStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface ResponseApiStatus {
  code: string;
  message: string | null;
  errors: { field: string; message: string }[] | null;
}

export interface ResponseApiMetaData {
  requestId: string | null;
  traceId: string;
  signature: string | null;
  timestamp: string;
}

export interface ResponseApi<T> {
  status: ResponseApiStatus;
  data: T;
  metaData: ResponseApiMetaData;
}

// Keep the UI-specific types for forms if needed, but the ones above match API docs
export interface TicketPayload {
  reason?: string;
  attachments?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  totalDays?: number;
  workDate?: string;
}
