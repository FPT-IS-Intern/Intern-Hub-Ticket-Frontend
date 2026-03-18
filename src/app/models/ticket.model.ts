export enum TicketType {
  REMOTE_WFH = 'REMOTE_WFH',
  REMOTE_ONSITE = 'REMOTE_ONSITE',
  EXPLANATION = 'EXPLANATION',
  LEAVE = 'LEAVE',
}

export interface CreateTicketRequest {
  ticketTypeId: string; // The backend uses Long, serialized as string
  payload: any;
}

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
}
