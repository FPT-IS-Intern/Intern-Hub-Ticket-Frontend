import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
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

type TicketStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

interface RequestTicketRow {
  id: number;
  fullName: string;
  email: string;
  department: string;
  ticketType: string;
  days: number;
  status: TicketStatus;
  approver: string | null;
}

interface RequestTicketTableRow extends RequestTicketRow {
  stt: number;
  selected: boolean;
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
export class RequestTicketManagementPage implements AfterViewInit {
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

  readonly filterStatusOptions = [
    { label: 'Đã duyệt', value: 'APPROVED' as const },
    { label: 'Chưa duyệt', value: 'PENDING' as const },
    { label: 'Từ chối', value: 'REJECTED' as const },
  ];

  readonly ticketTypeOptions = [
    'Phiếu nghỉ phép',
    'Phiếu giải trình',
    'Phiếu Remote - WFH',
    'Phiếu Remote - Onsite',
  ];

  private readonly sourceRows: RequestTicketRow[] = [
    {
      id: 1,
      fullName: 'Mr Bear',
      email: '@bear',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 2,
      status: 'APPROVED',
      approver: 'Lê Duy Hoàng Linh',
    },
    {
      id: 2,
      fullName: 'Trà Nhật Đông',
      email: '@DongTN2@fpt.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 8,
      status: 'PENDING',
      approver: null,
    },
    {
      id: 3,
      fullName: 'Lê Duy Hoàng Linh',
      email: '@LinhLDH@fpt.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 5,
      status: 'PENDING',
      approver: null,
    },
    {
      id: 4,
      fullName: 'Lê Duy Hoàng Linh',
      email: 'username@gmail.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 2,
      status: 'APPROVED',
      approver: 'Lê Duy Hoàng Linh',
    },
    {
      id: 5,
      fullName: 'Lê Duy Hoàng Linh',
      email: 'username@gmail.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 2,
      status: 'PENDING',
      approver: null,
    },
    {
      id: 6,
      fullName: 'Lê Duy Hoàng Linh',
      email: 'username@gmail.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 2,
      status: 'APPROVED',
      approver: 'Lê Duy Hoàng Linh',
    },
    {
      id: 7,
      fullName: 'Lê Duy Hoàng Linh',
      email: 'username@gmail.com',
      department: 'Phòng Banking',
      ticketType: 'Phiếu nghỉ phép',
      days: 2,
      status: 'PENDING',
      approver: null,
    },
  ];

  tableRows: RequestTicketTableRow[] = [];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    this.columnTemplates = {
      select: this.selectTemplate,
      stt: this.sttTemplate,
      fullName: this.nameTemplate,
      detail: this.detailTemplate,
      status: this.statusTemplate,
      approver: this.approverTemplate,
    };
    this.cdr.detectChanges();
  }

  get selectedCount(): number {
    return this.tableRows.filter((row) => row.selected).length;
  }

  get totalRequests(): number {
    return this.sourceRows.length;
  }

  get approvedRequests(): number {
    return this.sourceRows.filter((row) => row.status === 'APPROVED').length;
  }

  get pendingRequests(): number {
    return this.sourceRows.filter((row) => row.status === 'PENDING').length;
  }

  get rejectedRequests(): number {
    return this.sourceRows.filter((row) => row.status === 'REJECTED').length;
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
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onTicketTypeChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onRefresh(): void {
    this.searchKeyword = '';
    this.selectedTicketType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  onHeaderCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isHeaderChecked = checked;
    this.tableRows = this.tableRows.map((row) => ({ ...row, selected: checked }));
  }

  onRowCheckboxChange(rowId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.tableRows = this.tableRows.map((row) =>
      row.id === rowId ? { ...row, selected: checked } : row
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
    const targetStatus: TicketStatus = this.bulkAction === 'approve' ? 'APPROVED' : 'REJECTED';
    this.sourceRows.forEach((row) => {
      const selected = this.tableRows.find((item) => item.id === row.id)?.selected;
      if (selected) {
        row.status = targetStatus;
        row.approver = 'Quản lý trực tiếp';
      }
    });
    this.showBulkConfirm = false;
    this.applyFilters();
  }

  onViewDetail(row: RequestTicketTableRow): void {
    void row;
  }

  getStatusLabel(status: TicketStatus): string {
    if (status === 'APPROVED') {
      return 'Đã duyệt';
    }
    if (status === 'REJECTED') {
      return 'Từ chối';
    }
    return 'Chưa duyệt';
  }

  getStatusBg(status: TicketStatus): string {
    if (status === 'APPROVED') {
      return 'var(--theme-green-50)';
    }
    if (status === 'REJECTED') {
      return 'var(--utility-50)';
    }
    return 'var(--neutral-color-10)';
  }

  getStatusText(status: TicketStatus): string {
    if (status === 'APPROVED') {
      return 'var(--theme-green-700)';
    }
    if (status === 'REJECTED') {
      return 'var(--utility-600)';
    }
    return 'var(--neutral-color-600)';
  }

  private applyFilters(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();

    const filtered = this.sourceRows.filter((row) => {
      const matchesKeyword =
        keyword.length === 0 ||
        row.fullName.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword);

      const matchesType =
        this.selectedTicketType.length === 0 || row.ticketType === this.selectedTicketType;

      const matchesStatus =
        this.selectedStatus.length === 0 || row.status === this.selectedStatus;

      return matchesKeyword && matchesType && matchesStatus;
    });

    this.tableRows = filtered.map((row, index) => ({
      ...row,
      department: 'Phòng Banking',
      stt: index + 1,
      selected: false,
    }));

    this.isHeaderChecked = false;
  }

  private syncHeaderCheckboxState(): void {
    this.isHeaderChecked =
      this.tableRows.length > 0 && this.tableRows.every((row) => row.selected);
  }
}
