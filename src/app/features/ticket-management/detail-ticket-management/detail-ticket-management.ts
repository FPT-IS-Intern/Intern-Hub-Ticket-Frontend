import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonContainerComponent,
  IconComponent,
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

interface ApprovalStep {
  stepNumber: number;
  statusLabel: string;       // e.g. "Đã tạo", "Chờ duyệt"
  statusType: 'done' | 'pending' | 'rejected';
  date: string | null;       // e.g. "05/01/2026" or "--:--"
  personName: string;        // e.g. "Vũ Ngọc Thùy Anh"
  description: string;       // e.g. "Khởi tạo", "Phê duyệt cấp 1 - Duyệt bởi ..."
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

  // ============================
  // Approval Steps (timeline)
  // ============================
  approvalSteps: ApprovalStep[] = [
    {
      stepNumber: 1,
      statusLabel: 'Đã tạo',
      statusType: 'done',
      date: '05/01/2026',
      personName: 'Vũ Ngọc Thùy Anh',
      description: 'Khởi tạo',
    },
    {
      stepNumber: 2,
      statusLabel: 'Chờ duyệt',
      statusType: 'pending',
      date: null,
      personName: 'Nguyen Thi Linh hoặc Nguyen Van Tien',
      description: 'Phê duyệt cấp 1 - Duyệt bởi <strong>Nguyen Thi Linh</strong>',
    },
    {
      stepNumber: 3,
      statusLabel: 'Chờ duyệt',
      statusType: 'pending',
      date: null,
      personName: 'Nguyen Van B',
      description: 'Phê duyệt cấp 2',
    },
  ];

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
    this.showRejectPopup = false;
    this.failMessage = 'Phiếu đã bị từ chối thành công';
    this.showFailPopup = true;
  }

  // ============================
  // Approve flow
  // ============================
  onApprove(): void {
    // TODO: integrate with API
    this.successMessage = 'Duyệt phiếu thành công!';
    this.showSuccessPopup = true;
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  closeFailPopup(): void {
    this.showFailPopup = false;
  }
}
