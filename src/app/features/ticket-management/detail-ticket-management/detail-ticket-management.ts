import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonContainerComponent,
  IconComponent,
  LabelButtonComponent,
} from '@goat-bravos/intern-hub-layout';

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

type TicketType = 'REMOTE_ONSITE' | 'REMOTE_WFH' | 'LEAVE_REQUEST' | 'EXPLANATION';
type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

interface ApprovalData {
  status: ApprovalStatus;
  approverName: string | null;
  approvedDate: string | null;
  rejectReason: string | null;
}

// Maps ticketType from request-ticket-management to internal type
const TICKET_TYPE_MAP: { [key: string]: TicketType } = {
  'Phiếu Remote - Onsite': 'REMOTE_ONSITE',
  'Phiếu Remote - WFH': 'REMOTE_WFH',
  'Phiếu nghỉ phép': 'LEAVE_REQUEST',
  'Phiếu giải trình': 'EXPLANATION',
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
    LabelButtonComponent,
    DetailRemoteOnsiteComponent,
    DetailRemoteWfhComponent,
    DetailLeaveRequestComponent,
    DetailExplanationComponent,
  ],
  templateUrl: './detail-ticket-management.html',
  styleUrl: './detail-ticket-management.scss',
})
export class DetailTicketManagementPage implements OnInit {
  ticketType: TicketType = 'REMOTE_ONSITE';
  ticketTitle = 'Phiếu Remote - Onsite';

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
  // Mock data cho từng loại phiếu
  // ============================
  remoteOnsiteData: RemoteOnsiteDetail = {
    fullName: 'Vũ Ngọc Thùy Anh',
    createdDate: '05/01/2026',
    startTime: '08:30 AM',
    reason: 'Làm đầy tháng cho mèo',
    workDate: '08/01/2026',
    location: 'HDBank - Chi nhánh Q1',
  };

  remoteWfhData: RemoteWfhDetail = {
    fullName: 'Vũ Ngọc Thùy Anh',
    createdDate: '05/01/2026',
    startTime: '08:30 AM',
    reason: 'Làm việc từ nhà do thời tiết xấu',
    workDate: '08/01/2026',
  };

  leaveRequestData: LeaveRequestDetail = {
    fullName: 'Vũ Ngọc Thùy Anh',
    createdDate: '05/01/2026',
    startDate: '08/01/2026',
    reason: 'Làm đầy tháng cho mèo',
    totalDays: 8,
    endDate: '15/01/2026',
  };

  explanationData: ExplanationDetail = {
    fullName: 'Vũ Ngọc Thùy Anh',
    createdDate: '05/01/2026',
    date: '08/01/2026',
    reason: 'Đi muộn do kẹt xe trên đường Nguyễn Văn Linh',
  };

  approvalData: ApprovalData = {
    status: 'PENDING',
    approverName: null,
    approvedDate: null,
    rejectReason: null,
  };

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read ticketType from query params or route data
    this.route.queryParams.subscribe((params) => {
      const typeParam = params['ticketType'] || '';
      if (TICKET_TYPE_MAP[typeParam]) {
        this.ticketType = TICKET_TYPE_MAP[typeParam];
      } else if (Object.values(TICKET_TYPE_MAP).includes(typeParam as TicketType)) {
        this.ticketType = typeParam as TicketType;
      }
      this.ticketTitle = TICKET_TITLE_MAP[this.ticketType];
    });
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

    // TODO: integrate with API - send rejectReason
    this.approvalData = {
      ...this.approvalData,
      status: 'REJECTED',
      approverName: 'Quản lý trực tiếp',
      approvedDate: new Date().toLocaleDateString('vi-VN'),
      rejectReason: this.rejectReason,
    };
    this.showRejectPopup = false;
    this.failMessage = 'Phiếu đã bị từ chối thành công';
    this.showFailPopup = true;
  }

  // ============================
  // Approve flow
  // ============================
  onApprove(): void {
    // TODO: integrate with API
    this.approvalData = {
      ...this.approvalData,
      status: 'APPROVED',
      approverName: 'Quản lý trực tiếp',
      approvedDate: new Date().toLocaleDateString('vi-VN'),
      rejectReason: null,
    };
    this.successMessage = 'Duyệt phiếu thành công!';
    this.showSuccessPopup = true;
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  closeFailPopup(): void {
    this.showFailPopup = false;
  }

  // ============================
  // Status helpers
  // ============================
  getStatusLabel(status: ApprovalStatus): string {
    if (status === 'APPROVED') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Từ chối';
    return 'Chưa duyệt';
  }

  getStatusBg(status: ApprovalStatus): string {
    if (status === 'APPROVED') return 'var(--theme-green-50)';
    if (status === 'REJECTED') return 'var(--utility-50)';
    return 'var(--neutral-color-10)';
  }

  getStatusText(status: ApprovalStatus): string {
    if (status === 'APPROVED') return 'var(--theme-green-700)';
    if (status === 'REJECTED') return 'var(--utility-600)';
    return 'var(--neutral-color-600)';
  }
}
