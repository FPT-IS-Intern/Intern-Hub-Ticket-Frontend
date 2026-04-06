import {
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonContainerComponent,
  ColumnConfig,
  DatePickerComponent,
  IconComponent,
  InputTextComponent,
  LabelButtonComponent,
  PopUpConfirmComponent,
  TableBodyComponent,
  TableHeaderComponent,
} from '@goat-bravos/intern-hub-layout';
import { TicketService } from '../../../services/ticket.service';
import {
  BulkApproveTicketRequest,
  BulkApproveResponse,
  FilterTicketRequest,
  TicketManagementDto,
  TicketStatus,
  TicketTypeDto,
} from '../../../models/ticket.model';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface RequestTicketTableRow {
  ticketId: string;
  fullName: string;
  email: string;
  department: string;
  typeName: string;
  ticketTypeId: string;
  status: TicketStatus;
  createdAt: number;
  approvedAt: number | null;
  updatedAt: number;
  stt: number;
  selected: boolean;
  createdBy: string;
  updatedBy: string;
  approverFullName: string | null;
  version: number;
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
export class RequestTicketManagementPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('selectTemplate') selectTemplate!: TemplateRef<any>;
  @ViewChild('sttTemplate') sttTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('ticketTypeTemplate') ticketTypeTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('approverTemplate') approverTemplate!: TemplateRef<any>;
  @ViewChild('createdAtTemplate') createdAtTemplate!: TemplateRef<any>;
  @ViewChild('approvedAtTemplate') approvedAtTemplate!: TemplateRef<any>;

  readonly columns: ColumnConfig[] = [
    { header: '', key: 'select', width: '50px' },
    { header: 'STT', key: 'stt', width: '50px' },
    { header: 'Họ và tên TTS', key: 'fullName', width: '220px' },
    { header: 'Phòng ban', key: 'department', width: '150px' },
    { header: 'Loại phiếu', key: 'ticketType', width: '250px' },
    { header: 'Ngày tạo', key: 'createdAt', width: '130px' },
    { header: 'Ngày duyệt', key: 'approvedAt', width: '130px' },
    { header: 'Trạng thái', key: 'status', width: '120' },
    { header: 'Người duyệt', key: 'approver', width: '220' },
  ];

  columnTemplates: { [key: string]: TemplateRef<any> } = {};

  // Filter state
  searchKeyword = '';
  selectedTicketType = '';
  selectedStatus: '' | TicketStatus = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedSortBy: 'createdAt' | 'updatedAt' | 'status' = 'createdAt';
  selectedSortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 0; // API uses 0-based
  pageSize = 10;
  totalItems = 0;
  totalPagesCount = 0;

  // Stat counts (from current filtered result)
  totalRequests = 0;
  approvedRequests = 0;
  pendingRequests = 0;
  rejectedRequests = 0;

  tableRows: RequestTicketTableRow[] = [];
  ticketTypes: TicketTypeDto[] = [];
  isLoading = false;
  isBulkApproving = false;
  showBulkConfirm = false;
  bulkAction: 'approve' | 'reject' = 'approve';
  isHeaderChecked = false;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private canApproveLevel1 = false;
  private canApproveLevel2 = false;
  private isApproverPermissionUnavailable = false;

  readonly sortByOptions = [
    { label: 'Ngày tạo', value: 'createdAt' },
    { label: 'Ngày cập nhật', value: 'updatedAt' },
    { label: 'Trạng thái', value: 'status' },
  ];

  readonly sortDirectionOptions = [
    { label: 'Giảm dần', value: 'desc' },
    { label: 'Tăng dần', value: 'asc' },
  ];

  readonly filterStatusOptions = [
    { label: 'Đã duyệt', value: TicketStatus.APPROVED },
    { label: 'Đang xem xét', value: TicketStatus.REVIEWING },
    { label: 'Chưa duyệt', value: TicketStatus.PENDING },
    { label: 'Từ chối', value: TicketStatus.REJECTED },
    { label: 'Đã hủy', value: TicketStatus.CANCELLED },
  ];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly ticketService: TicketService,
  ) {}

  ngOnInit(): void {
    this.loadApproverPermissions();
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      types: this.ticketService.getTicketTypes(),
      tickets: this.ticketService.getAllTicketsForManagement(
        this.currentPage,
        this.pageSize,
        this.buildFilter(),
      ),
      statCard: this.ticketService.getStatCardData(),
    }).subscribe({
      next: (res) => {
        this.ticketTypes = res.types.data;
        this.applyStatCardData(res.statCard.data);
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

  applyStatCardData(data: import('../../../models/ticket.model').StatCardData): void {
    if (!data) return;
    this.totalRequests = data.totalTicket;
    this.approvedRequests = data.totalTicketApprove;
    this.pendingRequests = data.totalTicketPending;
    this.rejectedRequests = data.totalTicketReject;
  }

  loadTickets(): void {
    this.isLoading = true;
    this.ticketService
      .getAllTicketsForManagement(this.currentPage, this.pageSize, this.buildFilter())
      .subscribe({
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
    const items: TicketManagementDto[] = (data.items || [])
      .slice()
      .sort(
        (a: TicketManagementDto, b: TicketManagementDto) =>
          Number(b.createdAt || 0) - Number(a.createdAt || 0),
      );

    this.tableRows = items.map((ticket, index) => {
      // Resolve typeName from ticketTypes list using ticketTypeId
      const matchedType = this.ticketTypes.find(
        (t) => String(t.ticketTypeId) === String(ticket.ticketTypeId)
      );

      return {
        ticketId: String(ticket.ticketId),
        fullName: ticket.fullName || '—',
        email: ticket.email || '-',
        department: '—',
        typeName: matchedType?.typeName || '—',
        ticketTypeId: ticket.ticketTypeId || '',
        status: ticket.status,
        createdAt: ticket.createdAt,
        approvedAt:
          ticket.approvedAt ??
          (ticket.status === TicketStatus.APPROVED ? ticket.updatedAt : null),
        updatedAt: ticket.updatedAt,
        stt: this.currentPage * this.pageSize + index + 1,
        selected: false,
        createdBy: String(ticket.createdBy),
        updatedBy: String(ticket.updatedBy),
        approverFullName: ticket.approverFullName || null,
        version: ticket.version ?? 0,
      };
    });
    this.syncSelectionWithPermission();
  }

  ngAfterViewInit(): void {
    this.columnTemplates = {
      select: this.selectTemplate,
      stt: this.sttTemplate,
      fullName: this.nameTemplate,
      ticketType: this.ticketTypeTemplate,
      createdAt: this.createdAtTemplate,
      approvedAt: this.approvedAtTemplate,
      status: this.statusTemplate,
      approver: this.approverTemplate,
    };
    this.cdr.detectChanges();
  }

  get selectedCount(): number {
    return this.tableRows.filter((row) => row.selected).length;
  }

  get hasApprovableRows(): boolean {
    return this.tableRows.some((row) => this.canApproveRow(row));
  }

  get totalPages(): number {
    return this.totalPagesCount;
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
    return this.bulkAction === 'approve' ? 'var(--theme-green-600)' : 'var(--utility-600)';
  }

  onSearchChange(value: string): void {
    this.searchKeyword = value;
    this.currentPage = 0;

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.loadTickets();
    }, 350);
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

  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.currentPage = 0;
    this.loadTickets();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.currentPage = 0;
    this.loadTickets();
  }

  onSortByChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onSortDirectionChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onRefresh(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    this.searchKeyword = '';
    this.selectedTicketType = '';
    this.selectedStatus = '';
    this.startDate = null;
    this.endDate = null;
    this.selectedSortBy = 'createdAt';
    this.selectedSortDirection = 'desc';
    this.currentPage = 0;
    this.loadTickets();
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  onHeaderCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isHeaderChecked = checked;
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      selected: this.canApproveRow(row) ? checked : false,
    }));
  }

  onRowCheckboxChange(ticketId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const targetRow = this.tableRows.find((row) => row.ticketId === ticketId);
    if (!targetRow || !this.canApproveRow(targetRow)) {
      this.syncHeaderCheckboxState();
      return;
    }
    this.tableRows = this.tableRows.map((row) =>
      row.ticketId === ticketId ? { ...row, selected: checked } : row,
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
    const selectedRows = this.tableRows.filter((row) => row.selected && this.canApproveRow(row));
    if (selectedRows.length === 0 || this.isBulkApproving) return;

    this.isBulkApproving = true;
    const request: BulkApproveTicketRequest = {
      idempotencyKey: this.generateIdempotencyKey(),
      tickets: selectedRows.map((row) => ({
        ticketId: row.ticketId,
        version: row.version,
      })),
    };

    this.ticketService.bulkApprove(request).subscribe({
      next: (res) => {
        const response: BulkApproveResponse = res.data;
        this.isBulkApproving = false;
        this.showBulkConfirm = false;
        if (response.failedTickets.length === 0) {
          this.clearSelectionAndReload();
        } else {
          const failedIds = new Set(response.failedTickets.map((f) => f.ticketId));
          this.tableRows = this.tableRows.map((row) =>
            failedIds.has(row.ticketId) ? row : { ...row, status: TicketStatus.APPROVED, selected: false },
          );
          this.isHeaderChecked = false;
          const successCount = response.successCount;
          const failCount = response.failedTickets.length;
          alert(`Duyệt thành công ${successCount} phiếu.\n${failCount} phiếu thất bại:\n${response.failedTickets.map((f) => `#${f.ticketId}: ${f.errorMessage}`).join('\n')}`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Bulk approve error:', err);
        this.isBulkApproving = false;
        this.showBulkConfirm = false;
        alert('Đã xảy ra lỗi khi duyệt phiếu. Vui lòng thử lại.');
        this.cdr.detectChanges();
      },
    });
  }

  private clearSelectionAndReload(): void {
    this.tableRows = this.tableRows.map((row) => ({ ...row, selected: false }));
    this.isHeaderChecked = false;
    this.showBulkConfirm = false;
    this.loadTickets();
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  onViewDetail(row: RequestTicketTableRow, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const ticketId = row.ticketId != null && row.ticketId !== '' ? String(row.ticketId) : '';
    const ticketTypeId = row.ticketTypeId || '';
    if (!ticketId) {
      return;
    }
    void this.router.navigate(['/ticket/detail-ticket-management'], {
      queryParams: { ticketId, ticketTypeId },
      relativeTo: this.route,
    });
  }

  /**
   * Handle click on the tbody — use event delegation to find the clicked row index.
   * Skips navigation if the click target is a checkbox or inside an input.
   */
  onTableBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Don't navigate if clicking on a checkbox or inside an input
    if (
      target.tagName === 'INPUT' ||
      target.closest('input') ||
      target.closest('button') ||
      target.classList.contains('approve-all-btn')
    ) {
      return;
    }

    // Walk up to find the <tr>
    const tr = target.closest('tr');
    if (!tr) return;

    // Find the parent <tbody> and get the row index
    const tbody = tr.closest('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = rows.indexOf(tr);
    if (rowIndex < 0 || rowIndex >= this.tableRows.length) return;

    this.onViewDetail(this.tableRows[rowIndex]);
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
    if (status === TicketStatus.REVIEWING) {
      return 'Chờ duyệt cấp 2';
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
    if (status === TicketStatus.REVIEWING) {
      return 'var(--brand-50)';
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
    if (status === TicketStatus.REVIEWING) {
      return 'var(--brand-600)';
    }
    return 'var(--neutral-color-600)';
  }

  formatDate(value: number | null | undefined): string {
    if (value == null) return '-';
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return '-';
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getShowingRange(): string {
    if (this.totalItems === 0) return '0';
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
    return `${start}-${end} / ${this.totalItems}`;
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
    const approvableRows = this.tableRows.filter((row) => this.canApproveRow(row));
    this.isHeaderChecked = approvableRows.length > 0 && approvableRows.every((row) => row.selected);
  }

  private buildFilter(): FilterTicketRequest {
    const filter: FilterTicketRequest = {};
    if (this.searchKeyword?.trim()) {
      filter.nameOrEmail = this.searchKeyword.trim();
    }
    if (this.selectedTicketType) {
      filter.typeName = this.selectedTicketType;
    }
    if (this.selectedStatus) {
      filter.status = this.selectedStatus;
    }
    if (this.startDate) {
      filter.startDate = this.startDate.getTime();
    }
    if (this.endDate) {
      // Set to end of day in local timezone
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      filter.endDate = end.getTime();
    }
    if (this.selectedSortBy) {
      filter.sortBy = this.selectedSortBy;
    }
    if (this.selectedSortDirection) {
      filter.sortDirection = this.selectedSortDirection;
    }
    return filter;
  }

  canApproveRow(row: RequestTicketTableRow): boolean {
    if (row.status !== TicketStatus.PENDING && row.status !== TicketStatus.REVIEWING) {
      return false;
    }

    if (this.isApproverPermissionUnavailable) {
      return true;
    }

    const currentApprovalLevel = row.status === TicketStatus.PENDING ? 1 : 2;

    return currentApprovalLevel <= 1
      ? this.canApproveLevel1
      : this.canApproveLevel2;
  }

  private loadApproverPermissions(): void {
    this.ticketService.getMyApproverPermission().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: (res) => {
        this.isApproverPermissionUnavailable = !res;
        this.canApproveLevel1 = !!res?.data?.canApproveLevel1;
        this.canApproveLevel2 = !!res?.data?.canApproveLevel2;
        this.syncSelectionWithPermission();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading approver permissions:', err);
      },
    });
  }

  private syncSelectionWithPermission(): void {
    this.tableRows = this.tableRows.map((row) =>
      this.canApproveRow(row) ? row : { ...row, selected: false },
    );
    this.syncHeaderCheckboxState();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }
}
