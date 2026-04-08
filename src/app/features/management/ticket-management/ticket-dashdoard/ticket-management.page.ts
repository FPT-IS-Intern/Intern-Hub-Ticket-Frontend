import {
  Component,
  OnInit,
  inject,
  signal,
  afterNextRender,
  viewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  TableBodyComponent,
  TableHeaderComponent,
  ColumnConfig,
  IconComponent
} from '@goat-bravos/intern-hub-layout';
import { HrmTicketService } from '../../../../services/hrm-ticket.service';
import {
  HrmTicketStatisticService,
  TicketRow,
  DashboardManagementTicket,
} from '../../../../services/hrm-ticket-statistic.service';
import { HrmUserManagementService } from '../../../../services/hrm-user-management.service';
import { AttendanceChartComponent } from '../../../../shared/components/attendance-chart/attendance-chart.component';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableBodyComponent,
    TableHeaderComponent,
    IconComponent,
    AttendanceChartComponent,
  ],
  templateUrl: './ticket-management.page.html',
  styleUrls: ['./ticket-management.page.scss'],
})
export class TicketManagementPage implements OnInit {
  // Signal-based ViewChild queries (Angular 17.3+)
  private readonly userTemplate = viewChild<TemplateRef<unknown>>('userTemplate');
  private readonly statusTemplate = viewChild<TemplateRef<unknown>>('statusTemplate');

  private readonly ticketService = inject(HrmTicketService);
  private readonly ticketStatisticService = inject(HrmTicketStatisticService);
  private readonly userManagementService = inject(HrmUserManagementService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Stats signals
  readonly totalIntern = signal<number | null>(null);
  readonly internshipChanging = signal<string>('');
  readonly workingAtClient = signal<number | null>(null);
  readonly workingAtOffice = signal<number | null>(null);
  readonly workingFromHome = signal<number | null>(null);

  readonly columns: ColumnConfig[] = [
    { header: 'Thông tin', key: 'user', width: '70%' },
    { header: 'Trạng thái', key: 'status', width: '30%' },
  ];

  // Sync table rows with signal state
  readonly explainationRows = signal<any[]>([]);

  readonly remoteRows = signal<any[]>([]);

  readonly approvalRows = signal<any[]>([]);

  readonly leaveRows = signal<any[]>([]);

  readonly columnTemplates = signal<{ [key: string]: TemplateRef<any> }>({});

  attendanceFromDate: Date = this.getToday();
  attendanceToDate: Date = this.getToday();

  constructor() {
    afterNextRender(() => {
      const userTpl = this.userTemplate();
      const statusTpl = this.statusTemplate();
      if (userTpl && statusTpl) {
        this.columnTemplates.set({
          user: userTpl,
          status: statusTpl,
        });
      }
    });
  }

  ngOnInit(): void {
    this.fetchTickets();
    this.fetchTotalIntern();
    this.fetchInternshipChanging();
    this.fetchExplainationTickets();
    this.fetchRemoteTickets();
    this.fetchLeaveTickets();
    this.fetchWorkingStats();
  }

  fetchTotalIntern(): void {
    this.userManagementService.getTotalIntern().subscribe({
      next: (response) => {
        if (response.data !== undefined) {
          this.totalIntern.set(response.data);
        }
      },
      error: (err) => console.error('Error fetching total intern', err)
    });
  }

  fetchWorkingStats(): void {
    this.ticketStatisticService.getTicketStatistic().subscribe({
      next: (response) => {
        if (response.data) {
          this.workingAtClient.set(response.data.workOnSite ?? 0);
          this.workingAtOffice.set(response.data.workOffSite ?? 0);
          this.workingFromHome.set(response.data.workFromHome ?? 0);
        }
      },
      error: (err) => console.error('Error fetching ticket statistic', err)
    });
  }

  fetchInternshipChanging(): void {
    this.userManagementService.getInternshipChanging().subscribe({
      next: (response) => {
        if (response.data) {
          this.internshipChanging.set(response.data);
        }
      },
      error: (err) => console.error('Error fetching internship changing', err)
    });
  }

  fetchExplainationTickets(): void {
    this.ticketStatisticService.getManagementTicketsByType('Phiếu giải trình').subscribe({
      next: (response) => {
        if (response.status?.code === 'success' && response.data?.items) {
          this.explainationRows.set(
            this.toDashboardRows(
              response.data.items.map((ticket: DashboardManagementTicket) => ({
                ticketId: ticket.ticketId,
                createdAt: String(ticket.createdAt),
                fullName: ticket.fullName,
                status: ticket.status,
              })),
            ).slice(0, 3),
          );
        }
      },
      error: (err: unknown) => console.error('Error fetching explaination tickets', err)
    });
  }

  fetchRemoteTickets(): void {
    this.ticketStatisticService.getManagementTicketsByType('Phiếu Remote').subscribe({
      next: (response) => {
        if (response.status?.code === 'success' && response.data?.items) {
          this.remoteRows.set(
            this.toDashboardRows(
              response.data.items.map((ticket: DashboardManagementTicket) => ({
                ticketId: ticket.ticketId,
                createdAt: String(ticket.createdAt),
                fullName: ticket.fullName,
                status: ticket.status,
              })),
            ).slice(0, 3),
          );
        }
      },
      error: (err: unknown) => console.error('Error fetching remote tickets', err)
    });
  }

  fetchLeaveTickets(): void {
    this.ticketStatisticService.getManagementTicketsByType('Phiếu nghỉ phép').subscribe({
      next: (response) => {
        if (response.status?.code === 'success' && response.data?.items) {
          this.leaveRows.set(
            this.toDashboardRows(
              response.data.items.map((ticket: DashboardManagementTicket) => ({
                ticketId: ticket.ticketId,
                createdAt: String(ticket.createdAt),
                fullName: ticket.fullName,
                status: ticket.status,
              })),
            ).slice(0, 3),
          );
        }
      },
      error: (err: unknown) => console.error('Error fetching leave tickets', err)
    });
  }

  fetchTickets(): void {
    this.ticketService
      .getFirstThreeRegistrationTickets()
      .subscribe({
      next: (response) => {
        if (response.status?.code === 'success' && response.data) {
          this.approvalRows.set(
            response.data
              .slice()
              .sort((a, b) => {
                const statusCompare =
                  this.getStatusPriority(a.ticketStatus) - this.getStatusPriority(b.ticketStatus);
                if (statusCompare !== 0) {
                  return statusCompare;
                }
                return this.toEpochFromDateString(b.registrationDate) - this.toEpochFromDateString(a.registrationDate);
              })
              .map((ticket) => ({
                user: {
                  name: ticket.senderFullName,
                  createdAt: this.formatDate(ticket.registrationDate || '')
                },
                status: {
                  text: this.mapStatusText(ticket.ticketStatus),
                  tone: this.mapStatusTone(ticket.ticketStatus)
                }
              }))
              .slice(0, 3),
          );
        }
      },
      error: (err: unknown) => console.error('Error fetching tickets', err)
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /** Convert epoch millisecond string to dd/MM/yyyy */
  formatTimestamp(timestampStr: string): string {
    if (!timestampStr) return '';
    const date = new Date(parseInt(timestampStr, 10));
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  mapStatusText(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING': return 'Chưa duyệt';
      case 'REVIEWING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status || '';
    }
  }

  mapStatusTone(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING': return 'pending';
      case 'REVIEWING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'neutral';
    }
  }

  private toDashboardRows(rows: TicketRow[]): any[] {
    return rows
      .slice()
      .sort((a: TicketRow, b: TicketRow) => {
        const statusCompare = this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
        if (statusCompare !== 0) {
          return statusCompare;
        }
        return Number(b.createdAt || 0) - Number(a.createdAt || 0);
      })
      .map((ticket: TicketRow) => ({
        user: {
          name: ticket.fullName,
          createdAt: this.formatTimestamp(ticket.createdAt)
        },
        status: {
          text: this.mapStatusText(ticket.status),
          tone: this.mapStatusTone(ticket.status)
        }
      }));
  }

  private getStatusPriority(status: string): number {
    switch ((status || '').toUpperCase()) {
      case 'PENDING':
        return 0;
      case 'REVIEWING':
        return 1;
      case 'APPROVED':
        return 2;
      case 'REJECTED':
        return 3;
      default:
        return 99;
    }
  }

  private toEpochFromDateString(value: string): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  getStatusColor(tone: string): string {
    switch (tone) {
      case 'error': return 'var(--utility-700)';
      case 'warning': return 'var(--brand-600)';
      case 'success': return 'var(--secondary-700)';
      case 'pending': return 'var(--neutral-600)';
      default: return 'var(--neutral-600)';
    }
  }

  goToRegistration(): void {
    this.router.navigate(['registration'], { relativeTo: this.route });
  }

  goToTicketManagement(): void {
    this.router.navigate(['/ticket/manage-tickets/registration']);
  }

  onAttendanceFromDateChange(date: Date | null): void {
    this.attendanceFromDate = date ?? this.getToday();
  }

  onAttendanceToDateChange(date: Date | null): void {
    this.attendanceToDate = date ?? this.getToday();
  }

  onAttendanceFromDateInputChange(value: string): void {
    this.onAttendanceFromDateChange(this.fromNativeDateValue(value));
  }

  onAttendanceToDateInputChange(value: string): void {
    this.onAttendanceToDateChange(this.fromNativeDateValue(value));
  }

  toNativeDateValue(date: Date | null): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date: Date | null): string {
    if (!date) {
      return 'DD/MM/YYYY';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private fromNativeDateValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  goToAttendance(): void {
    this.router.navigate(['attendance'], { relativeTo: this.route });
  }
}
