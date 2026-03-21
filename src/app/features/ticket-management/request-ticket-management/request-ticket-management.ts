import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ButtonContainerComponent,
  ColumnConfig,
  IconComponent,
  InputTextComponent,
  LabelButtonComponent,
  PopUpConfirmComponent,
  TableBodyComponent,
  TableHeaderComponent,
} from '@goat-bravos/intern-hub-layout';
import { TicketService } from '../../../services/ticket.service';
import { TicketDto, TicketStatus, TicketTypeDto } from '../../../models/ticket.model';
import { forkJoin } from 'rxjs';

interface RequestTicketTableRow extends TicketDto {
  stt: number;
  selected: boolean;
  typeName: string;
  fullName: string; // From API it's userId, need to map or just show ID for now
  department: string; // Not in TicketDto, mock it
  days: number; // In payload usually
}

@Component({
  selector: 'app-request-ticket-management-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    InputTextComponent,
    ButtonContainerComponent,
    TableHeaderComponent,
    TableBodyComponent,
    LabelButtonComponent,
    PopUpConfirmComponent,
  ],
  templateUrl: './request-ticket-management.html',
  styleUrl: './request-ticket-management.scss',
})
export class RequestTicketManagementPage implements OnInit, AfterViewInit {
  @ViewChild('selectTemplate') selectTemplate!: TemplateRef<any>;
  @ViewChild('sttTemplate') sttTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('detailTemplate') detailTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('approverTemplate') approverTemplate!: TemplateRef<any>;

  readonly columns: ColumnConfig[] = [
    { header: '', key: 'select', width: '50px' },
    { header: 'STT', key: 'stt', width: '50px' },
    { header: 'Họ và tên TTS', key: 'fullName', width: '200px' },
    { header: 'Phòng ban', key: 'department', width: '150px' },
    { header: 'Loại phiếu', key: 'ticketType', width: '300px' },
    { header: 'Số ngày', key: 'days', width: '70' },
    { header: 'Chi tiết', key: 'detail', width: '107' },
    { header: 'Trạng thái', key: 'status', width: '107' },
    { header: 'Người duyệt', key: 'approver', width: '205' },
  ];

  columnTemplates: { [key: string]: TemplateRef<any> } = {};

  searchKeyword = '';
  selectedTicketType = '';
  selectedStatus: '' | TicketStatus = '';
  isHeaderChecked = false;
  showBulkConfirm = false;
  bulkAction: 'approve' | 'reject' = 'approve';

  // Pagination
  currentPage = 0; // API uses 0-based
  pageSize = 10;
  totalItems = 0;
  totalPagesCount = 0;

  tableRows: RequestTicketTableRow[] = [];
  ticketTypes: TicketTypeDto[] = [];
  isLoading = false;

  readonly filterStatusOptions = [
    { label: 'Đã duyệt', value: TicketStatus.APPROVED },
    { label: 'Chưa duyệt', value: TicketStatus.PENDING },
    { label: 'Từ chối', value: TicketStatus.REJECTED },
    { label: 'Đã hủy', value: TicketStatus.CANCELLED },
  ];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      types: this.ticketService.getTicketTypes(),
      tickets: this.ticketService.getAllTickets(this.currentPage, this.pageSize),
    }).subscribe({
      next: (res) => {
        this.ticketTypes = res.types.data;
        this.processTicketsResponse(res.tickets.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.isLoading = false;
      },
    });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.ticketService.getAllTickets(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.processTicketsResponse(res.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.isLoading = false;
      },
    });
  }

  processTicketsResponse(data: any): void {
    if (!data) return;
    this.totalItems = data.totalItems || 0;
    this.totalPagesCount = data.totalPages || 0;
    const items = data.items || [];

    this.tableRows = items.map((ticket: TicketDto, index: number) => {
      const type = this.ticketTypes.find((t) => t.ticketTypeId === ticket.ticketTypeId);
      return {
        ...ticket,
        stt: this.currentPage * this.pageSize + index + 1,
        selected: false,
        typeName: type ? type.typeName : 'Unknown',
        fullName: `User ${ticket.userId}`, // Mock name since it's not in TicketDto
        department: 'Phòng Banking', // Mock department
        days: 0, // Need to get from payload if we have detail, but for list we mock
      } as RequestTicketTableRow;
    });
  }

  ngAfterViewInit(): void {
    this.columnTemplates = {
      select: this.selectTemplate,
      stt: this.sttTemplate,
      fullName: this.nameTemplate,
      detail: this.detailTemplate,
      status: this.statusTemplate,
      approver: this.approverTemplate,
      ticketType: this.detailTemplate, // Use detail template for type to show typeName
    };
    this.cdr.detectChanges();
  }

  get selectedCount(): number {
    return this.tableRows.filter((row) => row.selected).length;
  }

  get totalPages(): number {
    return this.totalPagesCount;
  }

  get totalRequests(): number {
    return this.totalItems;
  }

  // Note: These summary counts might be inaccurate if only based on current page
  // Ideally backend provides these. For now, we keep them simple.
  get approvedRequests(): number {
    return this.tableRows.filter((row) => row.status === TicketStatus.APPROVED).length;
  }

  get pendingRequests(): number {
    return this.tableRows.filter((row) => row.status === TicketStatus.PENDING).length;
  }

  get rejectedRequests(): number {
    return this.tableRows.filter((row) => row.status === TicketStatus.REJECTED).length;
  }

  get confirmTitle(): string {
    return this.bulkAction === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối';
  }

  get confirmContent(): string {
    return this.bulkAction === 'approve'
      ? `Bạn có chắc muốn duyệt ${this.selectedCount} phiếu đã chọn?`
      : `Bạn có chắc muốn từ chối ${this.selectedCount} phiếu đã chọn?`;
  }

  get confirmButtonColor(): string {
    return this.bulkAction === 'approve'
      ? 'var(--theme-green-600)'
      : 'var(--utility-600)';
  }

  onSearchChange(value: string): void {
    this.searchKeyword = value;
    // For real app, might want to debounce and call API with filter
    // Current API doesn't seem to have search/filter params in getAll
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onTicketTypeChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onRefresh(): void {
    this.searchKeyword = '';
    this.selectedTicketType = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadTickets();
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  onHeaderCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isHeaderChecked = checked;
    this.tableRows = this.tableRows.map((row) => ({ ...row, selected: checked }));
  }

  onRowCheckboxChange(ticketId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.tableRows = this.tableRows.map((row) =>
      row.ticketId === ticketId ? { ...row, selected: checked } : row
    );
    this.syncHeaderCheckboxState();
  }

  openBulkConfirm(action: 'approve' | 'reject'): void {
    if (this.selectedCount === 0) {
      return;
    }
    this.bulkAction = action;
    this.showBulkConfirm = true;
  }

  cancelBulkConfirm(): void {
    this.showBulkConfirm = false;
  }

  confirmBulkAction(): void {
    // API doesn't have bulk approve, would need to call individually or wait for new API
    // For now we just mock success for the UI
    const targetStatus = this.bulkAction === 'approve' ? TicketStatus.APPROVED : TicketStatus.REJECTED;

    // In real app:
    // const selectedTickets = this.tableRows.filter(r => r.selected);
    // const calls = selectedTickets.map(t => this.ticketService.approveTicket(t.ticketId, { idempotencyKey: uuid(), version: t.version }));
    // forkJoin(calls).subscribe(...)

    this.tableRows.forEach((row) => {
      if (row.selected) {
        row.status = targetStatus;
      }
    });

    this.showBulkConfirm = false;
    this.cdr.detectChanges();
  }

  onViewDetail(row: RequestTicketTableRow): void {
    this.router.navigate(['/detail-ticket-management'], {
      queryParams: { ticketId: row.ticketId, ticketType: row.typeName },
    });
  }

  getStatusLabel(status: TicketStatus): string {
    if (status === TicketStatus.APPROVED) {
      return 'Đã duyệt';
    }
    if (status === TicketStatus.REJECTED) {
      return 'Từ chối';
    }
    if (status === TicketStatus.CANCELLED) {
      return 'Đã hủy';
    }
    return 'Chưa duyệt';
  }

  getStatusBg(status: TicketStatus): string {
    if (status === TicketStatus.APPROVED) {
      return 'var(--theme-green-50)';
    }
    if (status === TicketStatus.REJECTED) {
      return 'var(--utility-50)';
    }
    if (status === TicketStatus.CANCELLED) {
        return 'var(--neutral-color-200)';
    }
    return 'var(--neutral-color-10)';
  }

  getStatusText(status: TicketStatus): string {
    if (status === TicketStatus.APPROVED) {
      return 'var(--theme-green-700)';
    }
    if (status === TicketStatus.REJECTED) {
      return 'var(--utility-600)';
    }
    if (status === TicketStatus.CANCELLED) {
        return 'var(--neutral-color-600)';
    }
    return 'var(--neutral-color-600)';
  }

  getShowingRange(): string {
    if (this.totalItems === 0) return '0';
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
    return `${start}-${end}`;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage + 1; // UI is 1-based

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    if (total > 1) pages.push(total);

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page - 1;
      this.loadTickets();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTickets();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value);
    this.currentPage = 0;
    this.loadTickets();
  }

  private syncHeaderCheckboxState(): void {
    this.isHeaderChecked =
      this.tableRows.length > 0 && this.tableRows.every((row) => row.selected);
  }
}
