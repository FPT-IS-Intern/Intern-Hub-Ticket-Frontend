import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonContainerComponent, IconComponent } from '@goat-bravos/intern-hub-layout';
import {
  DetailLeaveRequestComponent,
  LeaveRequestDetail,
} from './components/detail-leave-request.component';
import {
  DetailUpdateProfileComponent,
  UpdateProfileDetail,
} from './components/detail-update-profile.component';
import {
  DetailNewsApprovalComponent,
  NewsApprovalDetail,
} from './components/detail-news-approval.component';
import {
  DetailRemoteWfhComponent,
  RemoteWfhDetail,
} from './components/detail-remote-wfh.component';
import {
  DetailRemoteOnsiteComponent,
  RemoteOnsiteDetail,
} from './components/detail-remote-onsite.component';
import {
  DetailExplanationComponent,
  ExplanationDetail,
} from './components/detail-explanation.component';
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
  EvidenceDto,
  TicketTypeDto,
} from '../../../models/ticket.model';
import { forkJoin, EMPTY, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type TicketType = TicketTypeCode;

interface ApprovalLevel {
  level: number;
  label: string;
  approverName: string;
  statusType: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
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
    DetailUpdateProfileComponent,
    DetailNewsApprovalComponent,
    DetailRemoteWfhComponent,
    DetailRemoteOnsiteComponent,
    DetailExplanationComponent,
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
  evidences: EvidenceDto[] = [];
  ticketTypes: TicketTypeDto[] = [];
  isLoading = false;
  isApproving = false;
  isRejecting = false;
  canApproveCurrentTicket = false;
  private isApproverPermissionUnavailable = false;
  private canApproveLevel1 = false;
  private canApproveLevel2 = false;

  showRejectPopup = false;
  rejectReason = '';
  showSuccessPopup = false;
  successMessage = '';
  showFailPopup = false;
  failMessage = '';

  leaveRequestData: LeaveRequestDetail = {
    senderFullName: '',
    createdDate: '',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0,
  };

  updateProfileData: UpdateProfileDetail = {
    senderFullName: '',
    createdDate: '',
    oldProfile: {} as any,
    newProfile: {} as any,
  };

  remoteWfhData: RemoteWfhDetail = {
    fullName: '',
    createdDate: '',
    startTime: '',
    reason: '',
    workDate: '',
  };

  remoteOnsiteData: RemoteOnsiteDetail = {
    fullName: '',
    createdDate: '',
    startTime: '',
    reason: '',
    workDate: '',
    location: '',
  };

  explanationData: ExplanationDetail = {
    fullName: '',
    createdDate: '',
    date: '',
    reason: '',
  };

  newsApprovalData: NewsApprovalDetail = {
    senderFullName: '',
    createdDate: '',
    newsId: '',
    title: '',
    summary: '',
    category: '',
    reason: '',
    content: '',
    previewUrl: '',
    imageUrls: [],
  };

  approvalLevels: ApprovalLevel[] = [];

  readonly imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ticketService: TicketService,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.loadApproverPermissions();

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

    // Use forkJoin with catchError per stream so one failure doesn't cancel others
    forkJoin({
      detail: this.ticketService.getTicketDetail(this.ticketId).pipe(
        catchError(() => EMPTY),
      ),
      types: this.ticketService.getTicketTypes().pipe(
        catchError(() => EMPTY),
      ),
      evidences: this.ticketService.getEvidences(this.ticketId).pipe(
        catchError(() => EMPTY),
      ),
    }).subscribe({
      next: ({ detail: detailRes, types: typesRes, evidences: evRes }) => {
        // Handle types (may be empty if errored)
        if (typesRes) {
          this.ticketTypes = typesRes.data || [];
          registerTicketTypeIds(this.ticketTypes);
        }

        // Handle detail (may be empty if errored)
        if (detailRes) {
          try {
            const data: TicketDetailResponse = detailRes.data;
            this.ticketDetail = data.ticketDetail;
            this.approvalInfo = data.ticketApprovalInfo;

            const matchedType = this.ticketTypes.find(
              (t) => t.ticketTypeId === data.ticketDetail.ticketTypeId,
            );
            if (matchedType) {
              this.ticketTitle = matchedType.typeName;
              const code = TICKET_TYPE_ID_TO_CODE[matchedType.ticketTypeId];
              this.ticketType = code ?? TicketTypeCode.LEAVE_REQUEST;
            }

            this.mapDetailToComponents(data.ticketDetail);
            this.buildApprovalLevels(data.ticketDetail, data.ticketApprovalInfo);
            this.updateApprovalPermission();
          } catch (e) {
            console.error('Error parsing ticket detail:', e);
          }
        }

        // Handle evidences (may be empty if errored)
        if (evRes) {
          this.evidences = evRes.data || [];
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private formatDate(dateStr: string | number | null | undefined): string {
    if (!dateStr && dateStr !== 0) return '';
    const ts = typeof dateStr === 'string' ? Number(dateStr) : dateStr;
    if (isNaN(ts as number)) return String(dateStr);
    return this.datePipe.transform(ts, 'dd/MM/yyyy') || '';
  }

  private formatDateTime(dateStr: string | number | null | undefined): string {
    if (!dateStr && dateStr !== 0) return '';
    const ts = typeof dateStr === 'string' ? Number(dateStr) : dateStr;
    if (isNaN(ts as number)) return String(dateStr);
    return this.datePipe.transform(ts, 'dd/MM/yyyy HH:mm') || '';
  }

  private mapDetailToComponents(detail: TicketDetailDto): void {
    const payload = detail.payload || {};
    const createdAtVal = detail.createdAt || (detail as any)['createdAt'] || '';
    const createdDate = this.formatDateTime(createdAtVal);
    const fullName = detail.senderFullName || '-';

    switch (this.ticketType) {
      case TicketTypeCode.LEAVE_REQUEST:
        this.leaveRequestData = {
          senderFullName: fullName,
          createdDate,
          startDate: payload['start_date'] || payload['startDate'] || '',
          endDate: payload['end_date'] || payload['endDate'] || '',
          reason: payload['reason'] || '',
          totalDays: payload['total_days'] || payload['totalDays'] || 0,
        };
        break;
      case TicketTypeCode.REMOTE_ONSITE:
        this.remoteOnsiteData = {
          fullName,
          createdDate,
          workDate: this.formatDate(payload['start_date'] || payload['startDate'] || payload['work_date'] || payload['workDate'] || ''),
          startTime: this.formatTimeRange(payload['start_time'] || payload['startTime'], payload['end_time'] || payload['endTime']),
          reason: payload['reason'] || '',
          location: payload['location'] || '-',
        };
        break;
      case TicketTypeCode.REMOTE_WFH:
        {
        const wfhTime = this.formatTimeRange(
          payload['start_time'] || payload['startTime'],
          payload['end_time'] || payload['endTime'],
        );
        this.remoteWfhData = {
          fullName,
          createdDate,
          workDate: this.formatDate(payload['start_date'] || payload['startDate'] || payload['work_date'] || payload['workDate'] || ''),
          startTime: wfhTime === '-' ? 'Cả ngày' : wfhTime,
          reason: payload['reason'] || '',
        };
        }
        break;
      case TicketTypeCode.EXPLANATION:
        this.explanationData = {
          fullName,
          createdDate,
          date: this.formatDate(payload['date'] || payload['work_date'] || payload['workDate'] || ''),
          reason: payload['reason'] || '',
        };
        break;
      case TicketTypeCode.UPDATE_PROFILE:
        this.updateProfileData = {
          senderFullName: fullName,
          createdDate,
          oldProfile: payload['oldProfile'] || {},
          newProfile: payload['newProfile'] || {},
        };
        break;
      case TicketTypeCode.NEWS_APPROVAL:
        this.newsApprovalData = {
          senderFullName: fullName,
          createdDate,
          newsId: String(payload['news_id'] || payload['newsId'] || ''),
          title: payload['title'] || '',
          summary: payload['summary'] || payload['shortDescription'] || '',
          category: payload['category'] || '',
          reason: payload['reason'] || '',
          content: payload['content'] || payload['body'] || '',
          previewUrl: payload['preview_url'] || payload['previewUrl'] || '',
          imageUrls: this.resolveImageUrls(payload),
        };
        break;
    }
  }

  private resolveImageUrls(payload: Record<string, any>): string[] {
    const imageCandidates: string[] = [];

    const images = payload['image_urls'] || payload['imageUrls'];
    if (Array.isArray(images)) {
      for (const item of images) {
        if (typeof item === 'string' && item.trim()) {
          imageCandidates.push(item.trim());
        }
      }
    } else if (typeof images === 'string' && images.trim()) {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === 'string' && item.trim()) {
              imageCandidates.push(item.trim());
            }
          }
        } else {
          imageCandidates.push(images.trim());
        }
      } catch {
        imageCandidates.push(images.trim());
      }
    }

    const thumbnail = payload['thumbnail_url'] || payload['thumbnailUrl'] || payload['thumbnail'];
    if (typeof thumbnail === 'string' && thumbnail.trim()) {
      imageCandidates.unshift(thumbnail.trim());
    }

    return [...new Set(imageCandidates)];
  }

  private formatTimeRange(startTime: any, endTime: any): string {
    const start = (startTime || '').toString().trim();
    const end = (endTime || '').toString().trim();

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end || '-';
  }

  private buildApprovalLevels(
    detail: TicketDetailDto,
    approvalInfo: TicketApprovalInfo,
  ): void {
    this.approvalLevels = [];

    const requiredApprovals = Math.min(2, Math.max(1, Number(detail.requiredApprovals || 1)));
    const level1Status = approvalInfo.statusLevel1;
    const level2Status = approvalInfo.statusLevel2;
    const isTicketRejected = detail.status === TicketStatus.REJECTED;

    const normalizeStatus = (status: string | null | undefined): string =>
      (status || '').toUpperCase();

    const isLevel1Approved = normalizeStatus(level1Status) === 'SUCCESS'
      || normalizeStatus(level1Status) === 'APPROVED'
      || normalizeStatus(level1Status) === 'APPROVE';
    const isLevel2Approved = normalizeStatus(level2Status) === 'SUCCESS'
      || normalizeStatus(level2Status) === 'APPROVED'
      || normalizeStatus(level2Status) === 'APPROVE';
    const isLevel1Rejected = normalizeStatus(level1Status) === 'REJECTED' || normalizeStatus(level1Status) === 'REJECT';
    const isLevel2Rejected = normalizeStatus(level2Status) === 'REJECTED' || normalizeStatus(level2Status) === 'REJECT';
    const isLevel1Pending = !isLevel1Approved && !isLevel1Rejected;
    const isOutOfOrderLevel2Decision = requiredApprovals >= 2 && isLevel1Pending && (isLevel2Approved || isLevel2Rejected);

    const currentApprovalLevel = Number(detail.currentApprovalLevel || 1);
    const rejectionLevel = isTicketRejected
      ? (
        isLevel2Rejected
          ? 2
          : isLevel1Rejected
            ? 1
            : (requiredApprovals >= 2 && (isLevel1Approved || currentApprovalLevel >= 2))
              ? 2
              : 1
      )
      : null;

    const getStatusType = (
      lvStatus: string | null | undefined,
    ): ApprovalLevel['statusType'] => {
      const normalized = (lvStatus || '').toUpperCase();

      if (normalized === 'SUCCESS' || normalized === 'APPROVE' || normalized === 'APPROVED') {
        return 'APPROVED';
      }
      if (normalized === 'REJECT' || normalized === 'REJECTED') {
        return 'REJECTED';
      }
      if (normalized === 'CANCEL' || normalized === 'CANCELLED') {
        return 'CANCELLED';
      }
      return 'PENDING';
    };

    const getStatusLabel = (lvStatus: string | null | undefined, level: number): string => {
      const normalized = (lvStatus || '').toUpperCase();

      if (normalized === 'SUCCESS' || normalized === 'APPROVE' || normalized === 'APPROVED') {
        return 'Đã duyệt';
      }
      if (normalized === 'REJECT' || normalized === 'REJECTED') return `Từ chối cấp ${level}`;
      return 'Chờ duyệt';
    };

    const level1DisplayStatus = isOutOfOrderLevel2Decision
      ? 'REJECTED'
      : rejectionLevel === 1
        ? 'REJECTED'
        : level1Status;
    const level2DisplayStatus = isOutOfOrderLevel2Decision
      ? 'REJECTED'
      : rejectionLevel === 2
        ? 'REJECTED'
        : level2Status;

    this.approvalLevels.push({
      level: 1,
      label: 'Chờ duyệt',
      approverName: approvalInfo.approverFullNameLevel1 || 'Chưa có người duyệt',
      statusType: getStatusType(level1DisplayStatus),
      statusLabel: getStatusLabel(level1DisplayStatus, 1),
      date: this.formatDate(approvalInfo.approvedAt),
      description: (level1DisplayStatus || '').toUpperCase() === 'SUCCESS'
        ? `Phê duyệt cấp 1 - Duyệt bởi ${approvalInfo.approverFullNameLevel1 || 'Không rõ'}`
        : (level1DisplayStatus || '').toUpperCase() === 'REJECTED'
          ? 'Phê duyệt cấp 1 - Từ chối'
          : 'Phê duyệt cấp 1',
    });

    if (requiredApprovals >= 2) {
      this.approvalLevels.push({
        level: 2,
        label: 'Chờ duyệt',
        approverName: approvalInfo.approverFullNameLevel2 || 'Chưa có người duyệt',
        statusType: getStatusType(level2DisplayStatus),
        statusLabel: getStatusLabel(level2DisplayStatus, 2),
        date: this.formatDate(approvalInfo.approvedAtLevel2),
        description: (level2DisplayStatus || '').toUpperCase() === 'REJECTED'
          ? 'Phê duyệt cấp 2 - Từ chối'
          : 'Phê duyệt cấp 2',
      });
    }
  }

  // ==============================================
  // Evidence helpers
  // ==============================================
  isImageEvidence(evidence: EvidenceDto): boolean {
    const ext = this.getFileExtension(evidence.evidenceKey);
    return this.imageExtensions.includes(ext.toLowerCase());
  }

  getFileExtension(key: string): string {
    if (!key) return '';
    const parts = key.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  getEvidenceUrl(evidence: EvidenceDto): string {
    if (!evidence.evidenceKey) return '';
    // Construct download URL from evidenceKey
    return `https://internhub-v2.bbtech.io.vn/api/ticket/evidences/download/${evidence.evidenceKey}`;
  }

  getFileName(key: string): string {
    if (!key) return '';
    const parts = key.split('/');
    return parts[parts.length - 1];
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes < 1024) return bytes ? bytes + ' B' : '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatCreatedDate(): string {
    if (!this.ticketDetail) return '';
    return this.formatDate(this.ticketDetail.createdAt);
  }

  // ==============================================
  // Navigation
  // ==============================================
  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  goToRequestManagement(): void {
    this.router.navigate(['/ticket/request-ticket-management'], {
      relativeTo: this.route,
    });
  }

  // ==============================================
  // Reject flow
  // ==============================================
  openRejectPopup(): void {
    if (!this.canUseApprovalAction()) return;
    this.rejectReason = '';
    this.showRejectPopup = true;
  }

  closeRejectPopup(): void {
    this.showRejectPopup = false;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (
      this.rejectReason.trim().length === 0 ||
      !this.ticketId ||
      !this.ticketDetail ||
      this.isRejecting ||
      !this.canUseApprovalAction()
    ) return;

    this.isRejecting = true;
    this.showRejectPopup = false;
    const idempotencyKey = `${this.ticketId}-${Date.now()}-${this.generateRandomSuffix()}`;

    this.ticketService
      .rejectTicket(this.ticketId, {
        comment: this.rejectReason.trim(),
        idempotencyKey,
        version: this.ticketDetail.version,
      })
      .subscribe({
        next: () => {
          this.isRejecting = false;
          this.successMessage = 'Từ chối phiếu thành công!';
          this.showSuccessPopup = true;
          this.loadTicketDetail();
        },
        error: (err) => {
          console.error('Error rejecting ticket:', err);
          this.isRejecting = false;
          this.failMessage = 'Từ chối phiếu thất bại. Vui lòng thử lại.';
          this.showFailPopup = true;
        },
      });
  }

  // ==============================================
  // Approve flow
  // ==============================================
  onApprove(): void {
    if (!this.ticketId || !this.ticketDetail || this.isApproving || !this.canUseApprovalAction()) return;

    this.isApproving = true;
    const idempotencyKey = `${this.ticketId}-${Date.now()}-${this.generateRandomSuffix()}`;

    this.ticketService
      .approveTicket(this.ticketId, {
        idempotencyKey,
        version: this.ticketDetail.version,
      })
      .subscribe({
        next: () => {
          this.isApproving = false;
          this.successMessage = 'Duyệt phiếu thành công!';
          this.showSuccessPopup = true;
          this.loadTicketDetail();
        },
        error: (err) => {
          console.error('Error approving ticket:', err);
          this.isApproving = false;
          this.failMessage = 'Duyệt phiếu thất bại. Vui lòng thử lại.';
          this.showFailPopup = true;
        },
      });
  }

  private generateRandomSuffix(): string {
    return Math.random().toString(36).substring(2, 11);
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
      return { label: 'Chờ duyệt cấp 2', bg: 'var(--brand-50)', color: 'var(--brand-600)' };
    }
    return { label: 'Chưa duyệt', bg: 'var(--neutral-color-100)', color: 'var(--neutral-color-600)' };
  }

  getApprovalProgress(): number {
    if (!this.approvalInfo || !this.ticketDetail) return 0;
    const total = Math.min(2, Math.max(1, Number(this.ticketDetail.requiredApprovals || 1)));
    let done = 0;
    if (this.approvalInfo.statusLevel1 === 'SUCCESS') done++;
    if (total >= 2 && this.approvalInfo.statusLevel2 === 'SUCCESS') done++;
    return (done / total) * 100;
  }

  get canShowApprovalActions(): boolean {
    if (!this.ticketDetail) return false;
    const level2Rejected = (this.approvalInfo?.statusLevel2 || '').toUpperCase() === 'REJECTED'
      || (this.approvalInfo?.statusLevel2 || '').toUpperCase() === 'REJECT';
    if (level2Rejected) return false;

    const isPendingOrReviewing =
      this.ticketDetail.status === TicketStatus.PENDING ||
      this.ticketDetail.status === TicketStatus.REVIEWING;
    return isPendingOrReviewing && this.canUseApprovalAction();
  }

  private loadApproverPermissions(): void {
    this.ticketService.getMyApproverPermission().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: (res) => {
        this.isApproverPermissionUnavailable = !res;
        this.canApproveLevel1 = !!res?.data?.canApproveLevel1;
        this.canApproveLevel2 = !!res?.data?.canApproveLevel2;
        this.updateApprovalPermission();
      },
      error: (err) => {
        console.error('Error loading approver permissions:', err);
        this.isApproverPermissionUnavailable = true;
        this.canApproveLevel1 = false;
        this.canApproveLevel2 = false;
        this.updateApprovalPermission();
      },
    });
  }

  private updateApprovalPermission(): void {
    if (!this.ticketDetail) {
      this.canApproveCurrentTicket = false;
      return;
    }

    if (this.isApproverPermissionUnavailable) {
      this.canApproveCurrentTicket = true;
      return;
    }

    const currentLevel = this.ticketDetail.status === TicketStatus.PENDING
      ? 1
      : this.ticketDetail.status === TicketStatus.REVIEWING
        ? 2
        : Math.max(1, Number(this.ticketDetail.currentApprovalLevel || 1));
    this.canApproveCurrentTicket = currentLevel <= 1
      ? this.canApproveLevel1
      : this.canApproveLevel2;
  }

  private canUseApprovalAction(): boolean {
    return this.isApproverPermissionUnavailable || this.canApproveCurrentTicket;
  }
}
