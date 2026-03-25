import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonContainerComponent, IconComponent } from '@goat-bravos/intern-hub-layout';

import {
  DetailRemoteOnsiteComponent,
  RemoteOnsiteDetail,
} from './components/detail-remote-onsite.component';
import {
  DetailRemoteWfhComponent,
  RemoteWfhDetail,
} from './components/detail-remote-wfh.component';
import {
  DetailLeaveRequestComponent,
  LeaveRequestDetail,
} from './components/detail-leave-request.component';
import {
  DetailExplanationComponent,
  ExplanationDetail,
} from './components/detail-explanation.component';
import { TicketService } from '../../../services/ticket.service';
import { TicketDetailDto, TicketStatus } from '../../../models/ticket.model';
import { forkJoin } from 'rxjs';

type TicketType = 'REMOTE_ONSITE' | 'REMOTE_WFH' | 'LEAVE_REQUEST' | 'EXPLANATION';

interface ApprovalStep {
  stepNumber: number;
  statusLabel: string; // e.g. "Đã tạo", "Chờ duyệt"
  statusType: 'done' | 'pending' | 'rejected';
  date: string | null; // e.g. "05/01/2026" or "--:--"
  personName: string; // e.g. "Vũ Ngọc Thùy Anh"
  description: string; // e.g. "Khởi tạo", "Phê duyệt cấp 1 - Duyệt bởi ..."
}

// Maps ticketType from request-ticket-management to internal type
const TICKET_TYPE_MAP: { [key: string]: TicketType } = {
  'Phiếu Remote - Onsite': 'REMOTE_ONSITE',
  'Phiếu Remote - WFH': 'REMOTE_WFH',
  'Phiếu nghỉ phép': 'LEAVE_REQUEST',
  'Phiếu giải trình': 'EXPLANATION',
  'Phiếu đăng tin tức': 'EXPLANATION',
};

const TICKET_TITLE_MAP: { [key in TicketType]: string } = {
  REMOTE_ONSITE: 'Phiếu Remote - Onsite',
  REMOTE_WFH: 'Phiếu Remote - WFH',
  LEAVE_REQUEST: 'Phiếu nghỉ phép',
  EXPLANATION: 'Phiếu giải trình',
};

@Component({
  selector: 'app-detail-ticket-management-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ButtonContainerComponent,
    DetailRemoteOnsiteComponent,
    DetailRemoteWfhComponent,
    DetailLeaveRequestComponent,
    DetailExplanationComponent,
  ],
  providers: [DatePipe],
  templateUrl: './detail-ticket-management.html',
  styleUrl: './detail-ticket-management.scss',
})
export class DetailTicketManagementPage implements OnInit {
  ticketId = '';
  ticketType: TicketType = 'REMOTE_ONSITE';
  ticketTitle = 'Phiếu Remote - Onsite';
  ticketDetail: TicketDetailDto | null = null;
  isLoading = false;

  // ============================
  // Popup state
  // ============================
  showRejectPopup = false;
  rejectReason = '';
  showSuccessPopup = false;
  successMessage = '';
  showFailPopup = false;
  failMessage = '';

  // ============================
  // Data for components
  // ============================
  remoteOnsiteData: RemoteOnsiteDetail = {
    fullName: '',
    createdDate: '',
    startTime: '',
    reason: '',
    workDate: '',
    location: '',
  };

  remoteWfhData: RemoteWfhDetail = {
    fullName: '',
    createdDate: '',
    startTime: '',
    reason: '',
    workDate: '',
  };

  leaveRequestData: LeaveRequestDetail = {
    fullName: '',
    createdDate: '',
    startDate: '',
    reason: '',
    totalDays: 0,
    endDate: '',
  };

  explanationData: ExplanationDetail = {
    fullName: '',
    createdDate: '',
    date: '',
    reason: '',
  };

  // ============================
  // Approval Steps (timeline)
  // ============================
  approvalSteps: ApprovalStep[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ticketService: TicketService,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.ticketId = params['ticketId'] || '';
      const typeParam = params['ticketType'] || '';

      if (TICKET_TYPE_MAP[typeParam]) {
        this.ticketType = TICKET_TYPE_MAP[typeParam];
      } else if (Object.values(TICKET_TYPE_MAP).includes(typeParam as TicketType)) {
        this.ticketType = typeParam as TicketType;
      }
      this.ticketTitle = TICKET_TITLE_MAP[this.ticketType];

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
        const data = res.data;
        this.ticketDetail = data;

        const matchedType = typesRes.data.find((t) => t.ticketTypeId === data.ticketTypeId);
        if (matchedType) {
          this.ticketTitle = matchedType.typeName;
          if (TICKET_TYPE_MAP[matchedType.typeName]) {
            this.ticketType = TICKET_TYPE_MAP[matchedType.typeName];
          } else {
            this.ticketType = 'EXPLANATION';
          }
        }

        this.mapDetailToComponents(data);
        this.generateApprovalSteps(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading ticket detail:', err);
        this.isLoading = false;
      },
    });
  }

  mapDetailToComponents(detail: TicketDetailDto): void {
    const payload = detail.payload || {};
    const createdDate = this.datePipe.transform(detail.createdAt, 'dd/MM/yyyy') || '';
    const fullName = `User ${detail.userId}`;

    switch (this.ticketType) {
      case 'REMOTE_ONSITE':
        this.remoteOnsiteData = {
          fullName,
          createdDate,
          startTime: payload['startTime'] || payload['start_time'] || '',
          reason: payload['reason'] || '',
          workDate: this.datePipe.transform(payload['workDate'] || payload['work_date'], 'dd/MM/yyyy') || '',
          location:
            payload['location'] === 'Hanoi'
              ? 'Hà Nội'
              : payload['location'] === 'HCM'
                ? 'TP. HCM'
                : payload['location'] || '',
        };
        break;
      case 'REMOTE_WFH':
        this.remoteWfhData = {
          fullName,
          createdDate,
          startTime: payload['startTime'] || payload['start_time'] || '08:30 AM',
          reason: payload['reason'] || '',
          workDate: this.datePipe.transform(payload['workDate'] || payload['work_date'], 'dd/MM/yyyy') || '',
        };
        break;
      case 'LEAVE_REQUEST':
        this.leaveRequestData = {
          fullName,
          createdDate,
          startDate: this.datePipe.transform(payload['startDate'] || payload['start_date'], 'dd/MM/yyyy') || '',
          endDate: this.datePipe.transform(payload['endDate'] || payload['end_date'], 'dd/MM/yyyy') || '',
          reason: payload['reason'] || '',
          totalDays: payload['totalDays'] || payload['total_days'] || 0,
        };
        break;
      case 'EXPLANATION':
        this.explanationData = {
          fullName,
          createdDate,
          date: this.datePipe.transform(payload['date'], 'dd/MM/yyyy') || '',
          reason: payload['reason'] || '',
        };
        break;
    }
  }

  generateApprovalSteps(detail: TicketDetailDto): void {
    const createdDate = this.datePipe.transform(detail.createdAt, 'dd/MM/yyyy') || '';
    const updatedDate = this.datePipe.transform(detail.updatedAt, 'dd/MM/yyyy') || '';
    const requiredApprovals = detail.requiredApprovals || 1;
    const currentApprovalLevel = detail.currentApprovalLevel || 0;

    this.approvalSteps = [];

    // Step 1: Always "Đã tạo"
    this.approvalSteps.push({
      stepNumber: 1,
      statusLabel: 'Đã tạo',
      statusType: 'done',
      date: createdDate,
      personName: `User ${detail.userId}`,
      description: 'Khởi tạo',
    });

    // Steps 2..N+1: One step per approval level
    for (let level = 1; level <= requiredApprovals; level++) {
      const stepNumber = level + 1;
      const approverName = detail.approverId ? `User ${detail.approverId}` : `Người duyệt cấp ${level}`;

      if (detail.status === TicketStatus.APPROVED) {
        // All levels are approved
        this.approvalSteps.push({
          stepNumber,
          statusLabel: 'Đã duyệt',
          statusType: 'done',
          date: level === requiredApprovals ? updatedDate : null,
          personName: approverName,
          description: `Phê duyệt cấp ${level} - <strong>Đã duyệt</strong>`,
        });
      } else if (detail.status === TicketStatus.REJECTED) {
        if (level < currentApprovalLevel) {
          // Levels before current were approved
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Đã duyệt',
            statusType: 'done',
            date: null,
            personName: approverName,
            description: `Phê duyệt cấp ${level} - <strong>Đã duyệt</strong>`,
          });
        } else if (level === currentApprovalLevel) {
          // This level rejected
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Từ chối',
            statusType: 'rejected',
            date: updatedDate,
            personName: approverName,
            description: `Phê duyệt cấp ${level} - <strong>Đã từ chối</strong>`,
          });
        } else {
          // Levels after rejection are skipped
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Bỏ qua',
            statusType: 'pending',
            date: null,
            personName: `Người duyệt cấp ${level}`,
            description: `Phê duyệt cấp ${level} - Không thực hiện`,
          });
        }
      } else if (detail.status === TicketStatus.PENDING) {
        if (level < currentApprovalLevel) {
          // Levels before current were approved
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Đã duyệt',
            statusType: 'done',
            date: null,
            personName: approverName,
            description: `Phê duyệt cấp ${level} - <strong>Đã duyệt</strong>`,
          });
        } else if (level === currentApprovalLevel) {
          // This level is waiting
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Chờ duyệt',
            statusType: 'pending',
            date: null,
            personName: approverName,
            description: `Phê duyệt cấp ${level} - Đang chờ phê duyệt`,
          });
        } else {
          // Future levels
          this.approvalSteps.push({
            stepNumber,
            statusLabel: 'Chờ duyệt',
            statusType: 'pending',
            date: null,
            personName: `Người duyệt cấp ${level}`,
            description: `Phê duyệt cấp ${level} - Chưa đến lượt`,
          });
        }
      } else if (detail.status === TicketStatus.CANCELLED) {
        this.approvalSteps.push({
          stepNumber,
          statusLabel: 'Đã hủy',
          statusType: 'rejected',
          date: level === 1 ? updatedDate : null,
          personName: `Người duyệt cấp ${level}`,
          description: `Phê duyệt cấp ${level} - Phiếu đã bị hủy`,
        });
      }
    }
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  goToRequestManagement(): void {
    this.router.navigate(['/request-ticket-management']);
  }

  // ============================
  // Reject flow
  // ============================
  openRejectPopup(): void {
    this.rejectReason = '';
    this.showRejectPopup = true;
  }

  closeRejectPopup(): void {
    this.showRejectPopup = false;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (this.rejectReason.trim().length === 0) return;

    this.showRejectPopup = false;
    this.failMessage = 'Phiếu đã bị từ chối thành công';
    this.showFailPopup = true;

    if (this.ticketDetail) {
      this.ticketDetail.status = TicketStatus.REJECTED;
      this.generateApprovalSteps(this.ticketDetail);
    }
  }

  // ============================
  // Approve flow
  // ============================
  onApprove(): void {
    if (!this.ticketId) return;

    this.ticketService
      .approveTicket(this.ticketId, {
        idempotencyKey: Math.random().toString(36).substring(7),
        version: 1,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Duyệt phiếu thành công!';
          this.showSuccessPopup = true;
          if (this.ticketDetail) {
            this.ticketDetail.status = TicketStatus.APPROVED;
            this.generateApprovalSteps(this.ticketDetail);
          }
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
}
