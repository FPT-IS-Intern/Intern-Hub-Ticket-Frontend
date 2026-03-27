import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonContainerComponent, IconComponent } from '@goat-bravos/intern-hub-layout';
import {
  DetailLeaveRequestComponent,
  LeaveRequestDetail,
} from './components/detail-leave-request.component';
import { TicketService } from '../../../services/ticket.service';
import {
  TicketDetailDto,
  TicketDetailResponse,
  TicketApprovalInfo,
  TicketStatus,
  TicketTypeCode,
  TICKET_TYPE_ID_TO_CODE,
  TICKET_TYPE_CODE_TO_NAME,
  registerTicketTypeIds,
} from '../../../models/ticket.model';
import { forkJoin } from 'rxjs';

type TicketType = TicketTypeCode;

interface ApprovalLevel {
  level: number;
  label: string;
  approverName: string;
  statusType: 'done' | 'pending' | 'rejected' | 'cancelled';
  statusLabel: string;
  date: string | null;
  description: string;
}

@Component({
  selector: 'app-detail-ticket-management-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ButtonContainerComponent,
    DetailLeaveRequestComponent,
  ],
  providers: [DatePipe],
  templateUrl: './detail-ticket-management.html',
  styleUrl: './detail-ticket-management.scss',
})
export class DetailTicketManagementPage implements OnInit {
  ticketId = '';
  ticketType: TicketType = TicketTypeCode.LEAVE_REQUEST;
  ticketTitle = 'Phiếu nghỉ phép';
  ticketDetail: TicketDetailDto | null = null;
  approvalInfo: TicketApprovalInfo | null = null;
  isLoading = false;

  showRejectPopup = false;
  rejectReason = '';
  showSuccessPopup = false;
  successMessage = '';
  showFailPopup = false;
  failMessage = '';

  leaveRequestData: LeaveRequestDetail = {
    fullName: '',
    createdDate: '',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0,
  };

  approvalLevels: ApprovalLevel[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ticketService: TicketService,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.ticketId = params['ticketId'] || '';
      const ticketTypeId = params['ticketTypeId'] || '';

      if (ticketTypeId && TICKET_TYPE_ID_TO_CODE[ticketTypeId]) {
        this.ticketType = TICKET_TYPE_ID_TO_CODE[ticketTypeId];
      } else {
        this.ticketType = TicketTypeCode.LEAVE_REQUEST;
      }
      this.ticketTitle = TICKET_TYPE_CODE_TO_NAME[this.ticketType] ?? 'Phiếu nghỉ phép';

      if (this.ticketId) {
        this.loadTicketDetail();
      }
    });
  }

  loadTicketDetail(): void {
    this.isLoading = true;
    forkJoin({
      detail: this.ticketService.getTicketDetail(this.ticketId),
      types: this.ticketService.getTicketTypes(),
    }).subscribe({
      next: ({ detail: res, types: typesRes }) => {
        registerTicketTypeIds(typesRes.data);

        const data: TicketDetailResponse = res.data;
        this.ticketDetail = data.ticketDetail;
        this.approvalInfo = data.ticketApprovalInfo;

        const matchedType = typesRes.data.find(
          (t) => t.ticketTypeId === data.ticketDetail.ticketTypeId,
        );
        if (matchedType) {
          this.ticketTitle = matchedType.typeName;
          const code = TICKET_TYPE_ID_TO_CODE[matchedType.ticketTypeId];
          this.ticketType = code ?? TicketTypeCode.LEAVE_REQUEST;
        }

        this.mapDetailToComponents(data.ticketDetail);
        this.buildApprovalLevels(data.ticketDetail, data.ticketApprovalInfo);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading ticket detail:', err);
        this.isLoading = false;
      },
    });
  }

  private formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const ts = Number(dateStr);
    if (isNaN(ts)) return dateStr;
    return this.datePipe.transform(ts, 'dd/MM/yyyy') || '';
  }

  private formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const ts = Number(dateStr);
    if (isNaN(ts)) return dateStr;
    return this.datePipe.transform(ts, 'dd/MM/yyyy HH:mm') || '';
  }

  private mapDetailToComponents(detail: TicketDetailDto): void {
    const payload = detail.payload || {};
    const createdDate = this.formatDateTime(String(detail.createdAt));
    const fullName = `User ${detail.userId}`;

    switch (this.ticketType) {
      case TicketTypeCode.LEAVE_REQUEST:
        this.leaveRequestData = {
          fullName,
          createdDate,
          startDate: payload['start_date'] || payload['startDate'] || '',
          endDate: payload['end_date'] || payload['endDate'] || '',
          reason: payload['reason'] || '',
          totalDays: payload['total_days'] || payload['totalDays'] || 0,
        };
        break;
      case TicketTypeCode.REMOTE_ONSITE:
        this.leaveRequestData = {
          fullName,
          createdDate,
          startDate: payload['work_date'] || payload['workDate'] || '',
          endDate: payload['start_time'] || payload['startTime'] || '',
          reason: payload['reason'] || '',
          totalDays: 0,
        };
        break;
      case TicketTypeCode.REMOTE_WFH:
        this.leaveRequestData = {
          fullName,
          createdDate,
          startDate: payload['work_date'] || payload['workDate'] || '',
          endDate: payload['start_time'] || payload['startTime'] || '',
          reason: payload['reason'] || '',
          totalDays: 0,
        };
        break;
      case TicketTypeCode.EXPLANATION:
        this.leaveRequestData = {
          fullName,
          createdDate,
          startDate: payload['date'] || '',
          endDate: '',
          reason: payload['reason'] || '',
          totalDays: 0,
        };
        break;
    }
  }

  private buildApprovalLevels(
    detail: TicketDetailDto,
    approvalInfo: TicketApprovalInfo,
  ): void {
    this.approvalLevels = [];
    const status = detail.status;

    const level1Status = approvalInfo.statusLevel1;
    const level2Status = approvalInfo.statusLevel2;

    const getStatusType = (
      level: 1 | 2,
      lvStatus: string,
    ): 'done' | 'pending' | 'rejected' => {
      if (lvStatus === 'SUCCESS') return 'done';
      if (lvStatus === 'REJECTED') return 'rejected';
      return 'pending';
    };

    const getStatusLabel = (lvStatus: string): string => {
      if (lvStatus === 'SUCCESS') return 'Đã duyệt';
      if (lvStatus === 'REJECTED') return 'Từ chối';
      return 'Chờ duyệt';
    };

    this.approvalLevels.push({
      level: 1,
      label: 'Cấp 1',
      approverName: approvalInfo.approverIdLevel1
        ? `User ${approvalInfo.approverIdLevel1}`
        : 'Người duyệt cấp 1',
      statusType: getStatusType(1, level1Status),
      statusLabel: getStatusLabel(level1Status),
      date: this.formatDate(approvalInfo.approvedAt),
      description: level1Status === 'SUCCESS'
        ? 'Phê duyệt cấp 1'
        : level1Status === 'REJECTED'
          ? 'Từ chối cấp 1'
          : 'Chờ phê duyệt cấp 1',
    });

    this.approvalLevels.push({
      level: 2,
      label: 'Cấp 2',
      approverName: approvalInfo.approverIdLevel2
        ? `User ${approvalInfo.approverIdLevel2}`
        : 'Người duyệt cấp 2',
      statusType: getStatusType(2, level2Status),
      statusLabel: getStatusLabel(level2Status),
      date: this.formatDate(approvalInfo.approvedAtLevel2),
      description: level2Status === 'SUCCESS'
        ? 'Phê duyệt cấp 2'
        : level2Status === 'REJECTED'
          ? 'Từ chối cấp 2'
          : 'Chờ phê duyệt cấp 2',
    });
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  goToRequestManagement(): void {
    this.router.navigate(['/ticket/request-ticket-management'], {
      relativeTo: this.route,
    });
  }

  openRejectPopup(): void {
    this.rejectReason = '';
    this.showRejectPopup = true;
  }

  closeRejectPopup(): void {
    this.showRejectPopup = false;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (this.rejectReason.trim().length === 0 || !this.ticketId || !this.ticketDetail) return;

    this.showRejectPopup = false;

    this.ticketService
      .rejectTicket(this.ticketId, {
        comment: this.rejectReason.trim(),
        idempotencyKey: Math.random().toString(36).substring(7),
        version: this.ticketDetail.version,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Từ chối phiếu thành công!';
          this.showSuccessPopup = true;
        },
        error: (err) => {
          console.error('Error rejecting ticket:', err);
          this.failMessage = 'Từ chối phiếu thất bại. Vui lòng thử lại.';
          this.showFailPopup = true;
        },
      });
  }

  onApprove(): void {
    if (!this.ticketId || !this.ticketDetail) return;

    this.ticketService
      .approveTicket(this.ticketId, {
        idempotencyKey: Math.random().toString(36).substring(7),
        version: this.ticketDetail.version,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Duyệt phiếu thành công!';
          this.showSuccessPopup = true;
        },
        error: (err) => {
          console.error('Error approving ticket:', err);
          this.failMessage = 'Duyệt phiếu thất bại. Vui lòng thử lại.';
          this.showFailPopup = true;
        },
      });
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  closeFailPopup(): void {
    this.showFailPopup = false;
  }

  getStatusBadge(status: TicketStatus): { label: string; bg: string; color: string } {
    if (status === TicketStatus.APPROVED) {
      return { label: 'Đã duyệt', bg: 'var(--theme-green-50)', color: 'var(--theme-green-700)' };
    }
    if (status === TicketStatus.REJECTED) {
      return { label: 'Từ chối', bg: 'var(--utility-50)', color: 'var(--utility-600)' };
    }
    if (status === TicketStatus.CANCELLED) {
      return { label: 'Đã hủy', bg: 'var(--neutral-color-200)', color: 'var(--neutral-color-600)' };
    }
    if (status === TicketStatus.REVIEWING) {
      return { label: 'Đang xem xét', bg: 'var(--brand-50)', color: 'var(--brand-600)' };
    }
    return { label: 'Chưa duyệt', bg: 'var(--neutral-color-100)', color: 'var(--neutral-color-600)' };
  }

  getApprovalProgress(): number {
    if (!this.approvalInfo) return 0;
    let done = 0;
    if (this.approvalInfo.statusLevel1 === 'SUCCESS') done++;
    if (this.approvalInfo.statusLevel2 === 'SUCCESS') done++;
    return (done / 2) * 100;
  }
}
