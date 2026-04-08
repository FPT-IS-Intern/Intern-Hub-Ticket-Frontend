import {
  Component,
  OnInit,
  AfterViewInit,
  TemplateRef,
  ViewChild,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  TableBodyComponent,
  ColumnConfig,
  InputTextComponent,
  IconComponent,
  ButtonContainerComponent,
} from '@goat-bravos/intern-hub-layout';
import {
  AttendanceManagementService,
  AttendanceFilterResponse,
} from '../../../services/attendance-management.service';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableBodyComponent,
    InputTextComponent,
    IconComponent,
    ButtonContainerComponent,
    DatePickerComponent,
  ],
  templateUrl: './attendance-management.page.html',
  styleUrls: ['./attendance-management.page.scss'],
})
export class AttendancePage implements OnInit, AfterViewInit {
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('fullNameTemplate') fullNameTemplate!: TemplateRef<any>;
  @ViewChild('workingMethodTemplate') workingMethodTemplate!: TemplateRef<any>;
  @ViewChild('checkInTimeTemplate') checkInTimeTemplate!: TemplateRef<any>;
  @ViewChild('checkOutTimeTemplate') checkOutTimeTemplate!: TemplateRef<any>;
  @ViewChild('locationTemplate') locationTemplate!: TemplateRef<any>;

  constructor(
    private attendanceService: AttendanceManagementService,
    private elementRef: ElementRef,
    private router: Router,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
  }

  attendanceLogs: AttendanceFilterResponse[] = [];
  loading = false;
  error = '';

  columns: ColumnConfig[] = [
    { header: 'STT', key: 'no', width: '60px' },
    { header: 'Họ và tên TTS', key: 'fullName', width: '220px' },
    { header: 'Ngày', key: 'attendanceDate', width: '130px' },
    { header: 'Giờ vào', key: 'checkInTime', width: '110px' },
    { header: 'Giờ ra', key: 'checkOutTime', width: '110px' },
    { header: 'Hình thức làm việc', key: 'workingMethod', width: '150px' },
    { header: 'Trạng thái', key: 'status', width: '150px' },
    { header: 'Vị trí', key: 'workLocation', width: '180px' },
  ];

  columnTemplates: { [key: string]: TemplateRef<any> } = {};

  searchKeyword = '';
  startDate: Date | null = this.getToday();
  endDate: Date | null = this.getToday();
  // Single-select status filter (API accepts one attendanceStatus string)
  selectedStatus = '';

  filterStatusOptions = [
    { value: 'CHECK_IN_ON_TIME', label: 'Đúng giờ' },
    { value: 'CHECK_IN_LATE', label: 'Vào muộn' },
    { value: 'CHECK_OUT_EARLY', label: 'Ra sớm' },
    { value: 'CHECK_OUT_ON_TIME', label: 'Ra đúng giờ' },
    { value: 'ABSENT', label: 'Vắng mặt' },
  ];

  // Sorting
  sortState: { [key: string]: 'asc' | 'desc' | null } = { attendanceDate: 'desc' };
  sortableColumns = ['fullName', 'attendanceDate', 'checkInTime', 'checkOutTime', 'status'];

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.startDate = this.getToday();
    this.endDate = this.getToday();
    this.loadAttendance();
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.columnTemplates = {
        fullName: this.fullNameTemplate,
        status: this.statusTemplate,
        workingMethod: this.workingMethodTemplate,
        checkInTime: this.checkInTimeTemplate,
        checkOutTime: this.checkOutTimeTemplate,
        workLocation: this.locationTemplate,
      };
    });
  }

  get tableRows(): any[] {
    let rows = this.attendanceLogs.map((log, index) => ({
      ...log,
      no: log.no ?? this.currentPage * this.pageSize + index + 1,
      workingMethod: log.workingMethod || 'SYSTEM',
      workLocation: log.workLocation || 'Chi nhánh FIS Quận 7',
    }));

    // Luôn ưu tiên sắp xếp theo attendanceDate giảm dần
    rows = [...rows].sort((a: any, b: any) => {
      const timeA = this.toDateTime(a.attendanceDate);
      const timeB = this.toDateTime(b.attendanceDate);
      return timeB - timeA;
    });

    // Nếu user sort cột khác thì áp dụng cột đó
    const sortKey = Object.keys(this.sortState).find(k => this.sortState[k] && k !== 'attendanceDate');
    if (sortKey) {
      const dir = this.sortState[sortKey];
      rows = [...rows].sort((a: any, b: any) => {
        const valA = (String(a[sortKey] || '')).toLowerCase();
        const valB = (String(b[sortKey] || '')).toLowerCase();
        return dir === 'asc'
          ? valA.localeCompare(valB, 'vi')
          : valB.localeCompare(valA, 'vi');
      });
    }

    // Gán lại STT sau khi sort
    rows.forEach((row, idx) => {
      row.no = this.currentPage * this.pageSize + idx + 1;
    });

    return rows;
  }

  /** Parse ngày an toàn cho nhiều format */
  private toDateTime(value: unknown): number {
    if (!value) return 0;
    const str = String(value).trim();
    if (!str) return 0;
    // dd/MM/yyyy
    const viMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (viMatch) {
      const [, dd, mm, yyyy] = viMatch;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
    }
    // fallback ISO / native parse
    const parsed = new Date(str).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  loadAttendance(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService
      .filterAttendance(
        {
          nameOrKeyword: this.searchKeyword || "",
          startDate: this.formatDateForApi(this.startDate) || "",
          endDate: this.formatDateForApi(this.endDate) || "",
          status: this.selectedStatus || "",
        },
        this.currentPage,
        this.pageSize
      )
      .subscribe({
        next: (response) => {
          if (response && response.data && Array.isArray(response.data.items)) {
            this.attendanceLogs = response.data.items;
            this.totalItems = Number(response.data.totalItems) || 0;
            this.totalPages = response.data.totalPages || 0;
          } else {
            this.attendanceLogs = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Attendance API error:', err);
          this.error = err.message || 'Không thể tải dữ liệu chấm công';
          this.loading = false;
        },
      });
  }

  onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    this.currentPage = 0;
    this.loadAttendance();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadAttendance();
  }

  onRefresh(): void {
    this.searchKeyword = '';
    this.startDate = this.getToday();
    this.endDate = this.getToday();
    this.selectedStatus = '';
    this.sortState = { attendanceDate: 'desc' };
    this.currentPage = 0;
    this.loadAttendance();
  }

  // Inline Filter methods
  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.currentPage = 0;
    this.loadAttendance();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.currentPage = 0;
    this.loadAttendance();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadAttendance();
  }

  onlyDateInput(event: KeyboardEvent): void {
    const allowed = /[0-9/]/;
    if (!allowed.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
      event.preventDefault();
    }
  }

  // Sort helpers
  isSortableColumn(key: string): boolean {
    return this.sortableColumns.includes(key);
  }

  toggleSort(key: string): void {
    // Cột ngày: luôn desc theo yêu cầu, không toggle
    if (key === 'attendanceDate') {
      this.sortState = { attendanceDate: 'desc' };
      return;
    }
    const current = this.sortState[key] || null;
    this.sortState = { attendanceDate: 'desc' };
    if (current === null) {
      this.sortState[key] = 'asc';
    } else if (current === 'asc') {
      this.sortState[key] = 'desc';
    }
  }

  getSortIcon(key: string): string {
    const dir = this.sortState[key] || null;
    if (dir === 'asc') return 'dsi dsi-chevron-up-line';
    if (dir === 'desc') return 'dsi dsi-chevron-down-line';
    return 'dsi dsi-chevron-selector-vertical-line';
  }

  getSortDirection(key: string): 'asc' | 'desc' | null {
    return this.sortState[key] || null;
  }

  // Pagination
  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadAttendance();
  }

  getShowingRange(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
    return `${start}-${end}`;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const current = this.currentPage + 1;
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      const start = Math.max(2, current - 1);
      const end = Math.min(this.totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (current < this.totalPages - 2) pages.push(-1);
      if (this.totalPages > 1) pages.push(this.totalPages);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page - 1;
      this.loadAttendance();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAttendance();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadAttendance();
    }
  }

  // Status helpers
  getStatusLabel(status: string): string {
    if (!status) return 'Vắng mặt';
    switch (status.toUpperCase()) {
      case 'CHECK_IN_ON_TIME': return 'Check - in';
      case 'CHECK_IN_LATE': return 'Check - in';
      case 'CHECK_OUT_ON_TIME': return 'Check - out';
      case 'CHECK_OUT_EARLY': return 'Check - out';
      case 'ABSENT': return 'Vắng mặt';
      default: return status;
    }
  }

  getStatusBgColor(status: string): string {
    if (!status) return 'var(--neutral-color-100)';
    switch (status.toUpperCase()) {
      case 'CHECK_IN_ON_TIME': return 'var(--theme-green-100)';
      case 'CHECK_IN_LATE': return 'var(--theme-yellow-100)';
      case 'CHECK_OUT_ON_TIME': return 'var(--theme-ocean-100)';
      case 'CHECK_OUT_EARLY': return 'var(--secondary-100)';
      case 'ABSENT': return 'var(--neutral-color-100)';
      default: return 'var(--neutral-color-100)';
    }
  }

  getStatusTextColor(status: string): string {
    if (!status) return 'var(--neutral-color-600)';
    switch (status.toUpperCase()) {
      case 'CHECK_IN_ON_TIME': return 'var(--theme-green-700)';
      case 'CHECK_IN_LATE': return 'var(--theme-yellow-700)';
      case 'CHECK_OUT_ON_TIME': return 'var(--theme-ocean-700)';
      case 'CHECK_OUT_EARLY': return 'var(--secondary-700)';
      case 'ABSENT': return 'var(--neutral-color-600)';
      default: return 'var(--neutral-color-600)';
    }
  }

  getStatusBorderColor(status: string): string {
    if (!status) return 'var(--neutral-color-200)';
    switch (status.toUpperCase()) {
      case 'CHECK_IN_ON_TIME': return 'var(--theme-green-300)';
      case 'CHECK_IN_LATE': return 'var(--theme-yellow-300)';
      case 'CHECK_OUT_ON_TIME': return 'var(--theme-ocean-300)';
      case 'CHECK_OUT_EARLY': return 'var(--secondary-300)';
      case 'ABSENT': return 'var(--neutral-color-200)';
      default: return 'var(--neutral-color-200)';
    }
  }

  // Working method helpers
  getWorkingMethodLabel(method: string): string {
    if (!method) return 'Office';
    switch (method.toUpperCase()) {
      case 'SYSTEM': return 'Office';
      case 'WEB': return 'Web';
      case 'MOBILE': return 'Mobile';
      default: return 'Office';
    }
  }

  getWorkingMethodBgColor(method: string): string {
    switch (method?.toUpperCase()) {
      case 'WEB':    return 'var(--theme-ocean-100)';
      case 'MOBILE': return 'var(--theme-green-100)';
      default:       return 'var(--neutral-color-25)';
    }
  }

  getWorkingMethodTextColor(method: string): string {
    switch (method?.toUpperCase()) {
      case 'WEB':    return 'var(--theme-ocean-700)';
      case 'MOBILE': return 'var(--theme-green-700)';
      default:       return 'var(--neutral-color-600)';
    }
  }

  formatTime(time: string | null): string {
    if (!time) return '-';
    // Return HH:mm from HH:mm:ss
    return time.length >= 5 ? time.substring(0, 5) : time;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    // Input: yyyy-MM-dd -> Output: dd/MM/yyyy
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /** Convert Date object to yyyy-MM-dd string for the backend API */
  formatDateForApi(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  onDateRangeChange(): void {
    this.currentPage = 0;
    this.loadAttendance();
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }
}
