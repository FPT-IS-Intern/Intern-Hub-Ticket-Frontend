export enum TicketStatus {
  PENDING = 'PENDING',
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
  createdBy: number;
  updatedBy: number;
}

export interface TicketDetailDto extends TicketDto {
  payload: Record<string, any>;
}

export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export interface EvidenceRequestItem {
  evidenceKey: string;
  fileType: string;
  fileSize: number;
}

export interface CreateTicketRequest {
  ticketTypeId: number;
  payload: Record<string, any>;
  evidences?: EvidenceRequestItem[];
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
  createdBy: number;
  updatedBy: number;
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
