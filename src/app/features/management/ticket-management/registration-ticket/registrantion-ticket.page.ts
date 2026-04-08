import {
    Component,
    OnInit,
    TemplateRef,
    ViewChild,
    inject,
    signal,
    computed,
    afterNextRender,
    viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
    IconComponent,
    InputTextComponent,
    TableHeaderComponent,
    TableBodyComponent,
    LabelButtonComponent,
    ColumnConfig
} from '@goat-bravos/intern-hub-layout';
import {
    HrmTicketService,
    RegistrationTicketRow,
    TicketFilterRequest,
    PaginatedData
} from '../../../../services/hrm-ticket.service';


@Component({
    selector: 'app-registration-ticket',
    standalone: true,
    imports: [
        FormsModule,
        IconComponent,
        InputTextComponent,
        TableHeaderComponent,
        TableBodyComponent,
        LabelButtonComponent
    ],
    templateUrl: './registrantion-ticket.page.html',
    styleUrls: ['./registrantion-ticket.page.scss'],
})
export class RegistrationTicketPage implements OnInit {
    // Signal-based ViewChild queries (Angular 17.3+)
    readonly sttTemplate = viewChild<TemplateRef<unknown>>('sttTemplate');
    readonly statusTemplate = viewChild<TemplateRef<unknown>>('statusTemplate');

    private readonly ticketService = inject(HrmTicketService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    // Stat counts – signals
    readonly totalCount = signal(0);
    readonly approvedCount = signal(0);
    readonly pendingCount = signal(0);
    readonly rejectedCount = signal(0);

    // Loading states – signals
    readonly loadingStats = signal(false);
    readonly loadingTable = signal(false);

    // Filter – signals
    readonly searchKeyword = signal('');
    readonly selectedStatus = signal('');
    readonly selectTicketType = signal('REGISTRATION');

    // Table config
    readonly columns: ColumnConfig[] = [
        { header: 'STT', key: 'stt', width: '5%' },
        { header: 'Họ và tên TTS', key: 'fullName', width: '25%' },
        { header: 'Email', key: 'companyEmail', width: '20%' },
        { header: 'Phòng ban', key: 'departmentName', width: '15%' },
        { header: 'Loại phiếu', key: 'ticketTypeName', width: '15%' },
        { header: 'Trạng thái', key: 'ticketStatus', width: '20%' },
    ];

    readonly registrationRows = signal<any[]>([]);
    columnTemplates: { [key: string]: TemplateRef<any> } = {};

    // Pagination – signals
    readonly currentPage = signal(1);
    readonly pageSize = signal(10);
    readonly totalItems = signal(0);
    readonly totalPages = signal(0);

    // Computed paginated rows
    readonly paginatedRows = computed(() => {
        return this.registrationRows();
    });

    constructor() {
        // Use afterNextRender to initialise column templates after view is ready
        afterNextRender(() => {
            const statusTpl = this.statusTemplate();
            if (statusTpl) {
                this.columnTemplates = {
                    ticketStatus: statusTpl,
                };
            }
        });
    }

    ngOnInit(): void {
        this.loadStats();
        this.fetchTickets(true);
    }

    // ===== Stat Cards =====

    loadStats(): void {
        this.loadingStats.set(true);
        forkJoin({
            approval: this.ticketService.getApprovalCount(),
            approved: this.ticketService.getApprovedCount(),
            pending: this.ticketService.getPendingCount(),
            rejected: this.ticketService.getRejectedCount(),
        }).subscribe({
            next: (results) => {
                this.totalCount.set(results.approval.data ?? 0);
                this.approvedCount.set(results.approved.data ?? 0);
                this.pendingCount.set(results.pending.data ?? 0);
                this.rejectedCount.set(results.rejected.data ?? 0);
                this.loadingStats.set(false);
            },
            error: (err) => {
                console.error('Lỗi load stat-cards:', err);
                this.loadingStats.set(false);
            }
        });
    }

    // ===== Table Data (POST filter) =====

    fetchTickets(resetPage = false): void {
        this.loadingTable.set(true);

        if (resetPage) {
            this.currentPage.set(1);
        }

        const filter: TicketFilterRequest = {
            keyword: this.searchKeyword().trim(),
            ticketStatus: this.selectedStatus(),
        };

        const page = this.currentPage() - 1;
        const size = this.pageSize();

        this.ticketService.getRegistrationTickets(filter, page, size).subscribe({
            next: (response) => {
                const paginatedData = response.data as PaginatedData<RegistrationTicketRow> | null;

                if (paginatedData?.items) {
                    const startIndex = page * size;
                    const rows = paginatedData.items.map(
                        (ticket: RegistrationTicketRow, index: number) => ({
                            stt: startIndex + index + 1,
                            ticketId: ticket.ticketId,
                            fullName: ticket.fullName,
                            companyEmail: ticket.companyEmail,
                            departmentName: ticket.departmentName ?? 'Phòng Banking',
                            ticketTypeName: ticket.ticketTypeName,
                            ticketStatus: {
                                text: this.mapStatusText(ticket.ticketStatus),
                                tone: this.mapStatusTone(ticket.ticketStatus),
                                raw: ticket.ticketStatus,
                            },
                        })
                    );
                    this.registrationRows.set(rows);
                    this.totalItems.set(paginatedData.totalItems ?? 0);
                    this.totalPages.set(paginatedData.totalPages ?? 0);
                } else {
                    this.registrationRows.set([]);
                    this.totalItems.set(0);
                    this.totalPages.set(0);
                }
                this.loadingTable.set(false);
            },
            error: (err) => {
                console.error('Lỗi load bảng phiếu:', err);
                this.registrationRows.set([]);
                this.totalItems.set(0);
                this.totalPages.set(0);
                this.loadingTable.set(false);
            }
        });
    }

    // ===== Pagination =====

    getShowingRange(): string {
        if (this.totalItems() === 0) return '0';
        const start = (this.currentPage() - 1) * this.pageSize() + 1;
        const end = Math.min(this.currentPage() * this.pageSize(), this.totalItems());
        return `${start}-${end}`;
    }

    getVisiblePages(): number[] {
        const pages: number[] = [];
        const total = this.totalPages();
        const current = this.currentPage();
        if (total <= 5) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push(-1);
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 2) pages.push(-1);
            pages.push(total);
        }
        return pages;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.currentPage.set(page);
            this.fetchTickets();
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.fetchTickets();
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.fetchTickets();
        }
    }

    onPageSizeChange(value: string): void {
        this.pageSize.set(+value);
        this.currentPage.set(1);
        this.fetchTickets();
    }

    // ===== Filter handlers =====

    onSearchChange(value: string): void { this.searchKeyword.set(value); }

    onStatusChange(value: string): void {
        this.selectedStatus.set(value);
        this.fetchTickets(true);
    }

    onSearch(): void { this.fetchTickets(true); }

    onRefresh(): void {
        this.searchKeyword.set('');
        this.selectedStatus.set('');
        this.loadStats();
        this.fetchTickets(true);
    }

    // ===== Navigate to detail =====

    onRowClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const tr = target.closest('tr');
        if (!tr) return;

        const tbody = tr.parentElement;
        if (!tbody) return;

        const rowIndex = Array.from(tbody.children).indexOf(tr);
        if (rowIndex >= 0 && rowIndex < this.paginatedRows().length) {
            const row = this.paginatedRows()[rowIndex];
            if (row.ticketId) {
                this.router.navigate([row.ticketId], { relativeTo: this.route });
            }
        }
    }

    goToManageTickets(): void {
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    // ===== Status helpers =====

    mapStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt';
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            case 'SUSPENDED': return 'Tạm ngưng';
            default: return status;
        }
    }

    mapStatusTone(status: string): string {
        switch (status) {
            case 'PENDING': return 'pending';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'SUSPENDED': return 'suspended';
            default: return 'neutral';
        }
    }

    getStatusBgColor(tone: string): string {
        switch (tone) {
            case 'success': return 'var(--secondary-50)';
            case 'error': return 'var(--utility-50)';
            case 'pending': return 'var(--brand-50)';
            default: return 'var(--neutral-50)';
        }
    }

    getStatusTextColor(tone: string): string {
        switch (tone) {
            case 'success': return 'var(--secondary-700)';
            case 'error': return 'var(--utility-700)';
            case 'pending': return 'var(--brand-700)';
            default: return 'var(--neutral-700)';
        }
    }

    getStatusBorderColor(tone: string): string {
        switch (tone) {
            case 'success': return 'var(--secondary-200)';
            case 'error': return 'var(--utility-200)';
            case 'pending': return 'var(--brand-200)';
            default: return 'var(--neutral-200)';
        }
    }
}
