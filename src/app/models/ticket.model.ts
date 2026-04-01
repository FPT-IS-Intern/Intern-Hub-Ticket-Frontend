export enum TicketStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Internal ticket type codes used in routing and UI components.
 * These are NOT backend values — they are derived from ticketTypeId at runtime.
 */
export enum TicketTypeCode {
  REMOTE_ONSITE = 'REMOTE_ONSITE',
  REMOTE_WFH = 'REMOTE_WFH',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  EXPLANATION = 'EXPLANATION',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
}

export const TICKET_TYPE_ID_TO_CODE: Record<string, TicketTypeCode> = {};

/**
 * Populate TICKET_TYPE_ID_TO_CODE at startup from the types list returned by the API.
 * Call registerTicketTypeIds(types) once after the first getTicketTypes() call.
 */
export function registerTicketTypeIds(types: TicketTypeDto[]): void {
  for (const t of types) {
    const code = TICKET_TYPE_NAME_MAP[t.typeName];
    if (code) {
      TICKET_TYPE_ID_TO_CODE[t.ticketTypeId] = code;
    }
  }
}

export const TICKET_TYPE_NAME_MAP: Record<string, TicketTypeCode> = {
  'Phiếu Remote - Onsite': TicketTypeCode.REMOTE_ONSITE,
  'Phiếu Remote - WFH': TicketTypeCode.REMOTE_WFH,
  'Phiếu nghỉ phép': TicketTypeCode.LEAVE_REQUEST,
  'Phiếu giải trình': TicketTypeCode.EXPLANATION,
  'Phiếu đăng tin tức': TicketTypeCode.EXPLANATION,
  'Phiếu Update Profile': TicketTypeCode.UPDATE_PROFILE,
};

export const TICKET_TYPE_CODE_TO_NAME: Record<TicketTypeCode, string> = {
  [TicketTypeCode.REMOTE_ONSITE]: 'Phiếu Remote - Onsite',
  [TicketTypeCode.REMOTE_WFH]: 'Phiếu Remote - WFH',
  [TicketTypeCode.LEAVE_REQUEST]: 'Phiếu nghỉ phép',
  [TicketTypeCode.EXPLANATION]: 'Phiếu giải trình',
  [TicketTypeCode.UPDATE_PROFILE]: 'Phiếu Update Profile',
};

export enum EvidenceStatus {
  UPLOADED = 'UPLOADED',
  DELETED = 'DELETED',
  PENDING = 'PENDING',
}

export interface StatCardData {
  totalTicket: number;
  totalTicketApprove: number;
  totalTicketPending: number;
  totalTicketReject: number;
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
  fullName: string;
  email: string;
  ticketTypeId: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  approverFullName: string | null;
}

export interface TicketDetailDto extends TicketDto {
  senderFullName: string;
  payload: Record<string, any>;
  requiredApprovals: number;
  currentApprovalLevel: number;
  approverId: string | null;
  version: number;
}

export interface TicketApprovalInfo {
  ticketId: string;
  userId: string;
  senderFullName: string;
  approverIdLevel1: string;
  approverIdLevel2: string;
  approverFullNameLevel1: string;
  approverFullNameLevel2: string;
  statusLevel1: 'SUCCESS' | 'PENDING' | 'REJECTED';
  statusLevel2: 'SUCCESS' | 'PENDING' | 'REJECTED';
  approvedAt: string;
  approvedAtLevel2: string;
  createdAt: string;
}

export interface TicketDetailResponse {
  ticketApprovalInfo: TicketApprovalInfo;
  ticketDetail: TicketDetailDto;
}

/**
 * DTO dành cho trang Quản lý phiếu yêu cầu (admin).
 * Backend trả về đã enrich fullName, email (từ HRM) và typeName (từ TicketType).
 */
export interface TicketManagementDto {
  ticketId: string;
  fullName: string;
  email: string;
  ticketTypeId: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  approverFullName: string | null;
  version: number;
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

export interface TicketApproveItem {
  ticketId: string;
  version: number;
}

export interface BulkApproveTicketRequest {
  idempotencyKey: string;
  tickets: TicketApproveItem[];
  comment?: string;
}

export interface BulkApproveResponse {
  totalProcessed: number;
  successCount: number;
  failedTickets: { ticketId: string; errorMessage: string }[];
}

export interface ApproverPermissionDto {
  approverId: string;
  maxApprovalLevel: number;
  canApproveLevel1: boolean;
  canApproveLevel2: boolean;
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
  evidenceKey: string;
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

/**
 * DTO for user's own tickets list (GET /ticket/me).
 * Includes approval level information for multi-level approval display.
 */
export interface UserTicketDto {
  ticketId: string;
  typeName: string;
  senderFullName: string;
  createdAt: string;         // timestamp ms as string
  reason: string | null;
  approverFullNameLevel1: string | null;
  approverFullNameLevel2: string | null;
  statusLevel1: 'SUCCESS' | 'PENDING' | 'REJECTED' | null;
  statusLevel2: 'SUCCESS' | 'PENDING' | 'REJECTED' | null;
  status: TicketStatus;
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
