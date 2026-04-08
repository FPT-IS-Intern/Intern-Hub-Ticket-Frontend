import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent, PopUpConfirmComponent } from '@goat-bravos/intern-hub-layout';
import { HrmTicketService, RegistrationTicketDetail } from '../../../../services/hrm-ticket.service';
import { UserService, RoleResponse } from '../../../../services/user.service';
import { SnowflakeId, toSnowflakeId } from '../../../../core/type/snowflake-id';
import { ImageUtils } from '../../../../utils/image.utils';

@Component({
    selector: 'app-detail-registration-ticket',
    standalone: true,
    imports: [
        IconComponent,
        PopUpConfirmComponent,
    ],
    templateUrl: './detail-registration-ticket.page.html',
    styleUrls: ['./detail-registration-ticket.page.scss'],
})
export class DetailRegistrationTicketPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly ticketService = inject(HrmTicketService);
    private readonly userService = inject(UserService);

    // State – signals
    readonly ticketId = signal<SnowflakeId | null>(null);
    readonly detail = signal<RegistrationTicketDetail | null>(null);
    readonly loading = signal(true);
    readonly error = signal(false);

    // Positions from API
    readonly positions = signal<string[]>([]);

    // Roles from API
    readonly roles = signal<RoleResponse[]>([]);
    readonly selectedRoleId = signal<string>('');

    // Action states – signals
    readonly approving = signal(false);
    readonly rejecting = signal(false);
    readonly suspending = signal(false);

    // Avatar fallback
    readonly avatarLoadError = signal(false);

    // Popup state
    readonly showSuccessPopup = signal(false);
    readonly showFailPopup = signal(false);
    readonly popupTitle = signal('');
    readonly popupMessage = signal('');
    private navigateAfterPopup = false;

    private openSuccessPopup(title: string, message: string, navigate = false) {
        this.navigateAfterPopup = navigate;
        this.popupTitle.set(title);
        this.popupMessage.set(message);
        this.showSuccessPopup.set(true);
    }

    private openFailPopup(title: string, message: string) {
        this.popupTitle.set(title);
        this.popupMessage.set(message);
        this.showFailPopup.set(true);
    }

    onPopupClose() {
        this.showSuccessPopup.set(false);
        this.showFailPopup.set(false);
        if (this.navigateAfterPopup) {
            this.navigateAfterPopup = false;
            this.goBack();
        }
    }

    // Computed: avatar URL resolved via ImageUtils
    readonly avatarUrl = computed(() => {
        const d = this.detail();
        return d ? (d.avatarUrl) : '';
    });

    // Computed: CV URL resolved via ImageUtils
    readonly cvUrl = computed(() => {
        const d = this.detail();
        return d ? (d.cvUrl) : '';
    });

    // Computed: có thể duyệt / từ chối khi trạng thái là PENDING
    readonly canAction = computed(() => {
        const d = this.detail();
        return !!d && d.sysStatus === 'PENDING';
    });

    // Computed: có thể tạm ngưng khi đã duyệt hoặc đang active
    readonly canSuspend = computed(() => {
        const d = this.detail();
        return !!d && (d.sysStatus === 'APPROVED' || d.sysStatus === 'ACTIVE');
    });

    ngOnInit(): void {
        this.loadPositions();
        this.loadRoles();
        const id = toSnowflakeId(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.ticketId.set(id);
            this.loadDetail();
        } else {
            this.error.set(true);
            this.loading.set(false);
        }
    }

    loadPositions(): void {
        this.userService.getPositions().subscribe({
            next: (response) => {
                if (response.status?.code === 'success' && response.data) {
                    this.positions.set(response.data.map(p => p.name));
                }
            },
            error: (err) => console.error('Lỗi load danh sách vị trí:', err),
        });
    }

    loadRoles(): void {
        this.userService.getRoles().subscribe({
            next: (response) => {
                if (response.status?.code === 'success' && response.data) {
                    this.roles.set(response.data);
                    console.log("Roless:", response.data);
                    
                }
            },
            error: (err) => console.error('Lỗi load danh sách vai trò:', err),
        });
    }

    loadDetail(): void {
        const id = this.ticketId();
        if (!id) return;
        this.loading.set(true);
        this.error.set(false);
        this.avatarLoadError.set(false);
        this.ticketService.getRegistrationTicketDetail(id).subscribe({
            next: (response) => {
                if (response.status?.code === 'success' && response.data) {
                    this.detail.set(response.data);
                } else {
                    this.error.set(true);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Lỗi load chi tiết phiếu:', err);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    /** Duyệt phiếu */
    onApprove(): void {
        const id = this.ticketId();
        const d = this.detail();
        const roleId = this.selectedRoleId();
        if (!id || !d || !this.canAction() || this.approving() || this.rejecting()) return;
        if (!roleId) {
            this.openFailPopup('Thiếu thông tin', 'Vui lòng chọn vai trò trước khi duyệt!');
            return;
        }
        this.approving.set(true);
        this.ticketService.approveTicket(id, roleId).subscribe({
            next: (response) => {
                if (response.status?.code === 'success') {
                    this.userService.assignUserRole(d.userId, roleId).subscribe({
                        next: () => {
                            this.approving.set(false);
                            this.openSuccessPopup('Duyệt thành công', 'Duyệt phiếu thành công!', true);
                        },
                        error: (err) => {
                            console.error('Lỗi gán vai trò:', err);
                            this.approving.set(false);
                            this.openSuccessPopup('Duyệt thành công', 'Duyệt phiếu thành công nhưng gán vai trò thất bại!', true);
                        },
                    });
                } else {
                    this.openFailPopup('Duyệt thất bại', 'Duyệt phiếu thất bại: ' + (response.status?.message || 'Lỗi không xác định'));
                    this.approving.set(false);
                }
            },
            error: (err) => {
                console.error('Lỗi duyệt phiếu:', err);
                this.openFailPopup('Duyệt thất bại', 'Duyệt phiếu thất bại!');
                this.approving.set(false);
            },
        });
    }

    /** Từ chối phiếu */
    onReject(): void {
        const id = this.ticketId();
        if (!id || !this.canAction() || this.approving() || this.rejecting()) return;
        this.rejecting.set(true);
        this.ticketService.rejectTicket(id).subscribe({
            next: (response) => {
                if (response.status?.code === 'success') {
                    this.rejecting.set(false);
                    this.openSuccessPopup('Từ chối thành công', 'Từ chối phiếu thành công!', true);
                } else {
                    this.openFailPopup('Từ chối thất bại', 'Từ chối phiếu thất bại: ' + (response.status?.message || 'Lỗi không xác định'));
                    this.rejecting.set(false);
                }
            },
            error: (err) => {
                console.error('Lỗi từ chối phiếu:', err);
                this.openFailPopup('Từ chối thất bại', 'Từ chối phiếu thất bại!');
                this.rejecting.set(false);
            },
        });
    }

    /** Rút ngắn URL, chỉ hiển thị tên domain (hostname) */
    shortenUrl(url: string): string {
        try {
            const parsed = new URL(url);
            return parsed.hostname.replace(/^www\./, '');
        } catch {
            return url;
        }
    }

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    onAvatarError(): void {
        this.avatarLoadError.set(true);
    }

    getInitials(fullName: string | null | undefined): string {
        const text = (fullName || '').trim();
        if (!text) return 'U';
        const parts = text.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
        return (first + last).toUpperCase() || 'U';
    }

    goBack(): void {
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    goToManageTickets(): void {
        this.router.navigate(['../../'], { relativeTo: this.route });
    }

    goToRegistration(): void {
        this.router.navigate(['../'], { relativeTo: this.route });
    }
}
