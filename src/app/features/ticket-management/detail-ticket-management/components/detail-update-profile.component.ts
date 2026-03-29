import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProfileData {
  cvUrl: string;
  userId: string;
  address: string;
  fullName: string;
  idNumber: string;
  avatarUrl: string;
  sysStatus: string;
  positionId: string;
  dateOfBirth: string;
  phoneNumber: string;
  companyEmail: string;
}

export interface UpdateProfileDetail {
  senderFullName: string;
  createdDate: string;
  oldProfile: ProfileData;
  newProfile: ProfileData;
}

interface DiffField {
  label: string;
  key: keyof ProfileData;
  oldValue: string;
  newValue: string;
  changed: boolean;
  type: 'text' | 'link' | 'image';
}

@Component({
  selector: 'app-detail-update-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="update-profile-container">
      <!-- Header Info -->
      <div class="profile-header-info">
        <div class="sender-row">
          <div class="sender-field">
            <span class="field-label">Người gửi</span>
            <span class="field-value bold">{{ data.senderFullName }}</span>
          </div>
          <div class="sender-field">
            <span class="field-label">Ngày tạo phiếu</span>
            <span class="field-value">{{ data.createdDate }}</span>
          </div>
          <div class="sender-field">
            <span class="field-label">Tổng thay đổi</span>
            <span class="field-value bold change-count">{{ changedCount }} trường</span>
          </div>
        </div>
      </div>

      <!-- Diff Table - GitHub Style -->
      <div class="diff-section">
        <div class="diff-header">
          <div class="diff-header-left">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zM7 11.5L3.5 8l1.41-1.41L7 8.67l4.09-4.08L12.5 6 7 11.5z"
                fill="currentColor"
              />
            </svg>
            <span>So sánh thay đổi Profile</span>
          </div>
          <div class="diff-stats">
            <span class="stat-changed">{{ changedCount }} thay đổi</span>
            <span class="stat-unchanged">{{ unchangedCount }} giữ nguyên</span>
          </div>
        </div>

        <div class="diff-table-wrapper">
          <table class="diff-table">
            <thead>
              <tr>
                <th class="col-field">Trường thông tin</th>
                <th class="col-old">
                  <div class="col-header-inner old">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7H11"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                    Giá trị cũ
                  </div>
                </th>
                <th class="col-new">
                  <div class="col-header-inner new">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 3V11M3 7H11"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                    Giá trị mới
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (field of diffFields; track field.key) {
                <tr [class.changed-row]="field.changed" [class.unchanged-row]="!field.changed">
                  <td class="cell-field">
                    <div class="field-name-wrapper">
                      @if (field.changed) {
                        <span class="change-indicator"></span>
                      }
                      <span class="field-key">{{ field.label }}</span>
                    </div>
                  </td>
                  <td class="cell-old">
                    @if (field.type === 'image') {
                      <div class="avatar-cell">
                        <img [src]="field.oldValue" alt="Avatar cũ" class="avatar-preview" />
                      </div>
                    } @else if (field.type === 'link') {
                      <a [href]="field.oldValue" target="_blank" rel="noopener" class="file-link">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M6 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V8M8 2H12M12 2V6M12 2L6 8"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        Xem file
                      </a>
                    } @else {
                      <span class="cell-value" [class.removed]="field.changed">{{
                        field.oldValue || '—'
                      }}</span>
                    }
                  </td>
                  <td class="cell-new">
                    @if (field.type === 'image') {
                      <div class="avatar-cell">
                        <img [src]="field.newValue" alt="Avatar mới" class="avatar-preview" />
                        @if (field.changed) {
                          <span class="new-badge">MỚI</span>
                        }
                      </div>
                    } @else if (field.type === 'link') {
                      <div class="link-cell">
                        <a
                          [href]="field.newValue"
                          target="_blank"
                          rel="noopener"
                          class="file-link"
                          [class.new-link]="field.changed"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M6 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V8M8 2H12M12 2V6M12 2L6 8"
                              stroke="currentColor"
                              stroke-width="1.2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          Xem file
                        </a>
                        @if (field.changed) {
                          <span class="new-badge">MỚI</span>
                        }
                      </div>
                    } @else {
                      <span class="cell-value" [class.added]="field.changed">{{
                        field.newValue || '—'
                      }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Summary Footer -->
        <div class="diff-footer">
          <div class="diff-legend">
            <span class="legend-item">
              <span class="legend-dot changed"></span>
              Đã thay đổi
            </span>
            <span class="legend-item">
              <span class="legend-dot unchanged"></span>
              Không thay đổi
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .update-profile-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* ========== Header Info ========== */
      .profile-header-info {
        padding: 20px 24px;
        border-bottom: 1px solid var(--neutral-color-200);
      }

      .sender-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      }

      .sender-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .field-label {
        font-size: 13px;
        color: var(--neutral-color-500);
        font-weight: 400;
      }

      .field-value {
        font-size: 14px;
        color: var(--neutral-color-800);
        font-weight: 400;
      }

      .field-value.bold {
        font-weight: 600;
      }

      .change-count {
        color: var(--theme-green-600);
      }

      /* ========== Diff Section ========== */
      .diff-section {
        border-top: 1px solid var(--neutral-color-200);
      }

      .diff-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 24px;
        background-color: var(--neutral-color-10);
        border-bottom: 1px solid var(--neutral-color-200);
      }

      .diff-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--neutral-color-800);

        svg {
          color: var(--brand-500);
        }
      }

      .diff-stats {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 12px;
        font-weight: 500;
      }

      .stat-changed {
        color: var(--theme-green-600);
        background: var(--theme-green-50);
        padding: 3px 10px;
        border-radius: 12px;
      }

      .stat-unchanged {
        color: var(--neutral-color-500);
        background: var(--neutral-color-100);
        padding: 3px 10px;
        border-radius: 12px;
      }

      /* ========== Diff Table ========== */
      .diff-table-wrapper {
        overflow-x: auto;
      }

      .diff-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .diff-table thead th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        background: var(--neutral-color-50);
        border-bottom: 2px solid var(--neutral-color-200);
        color: var(--neutral-color-600);
        white-space: nowrap;
      }

      .col-field {
        width: 180px;
        min-width: 160px;
      }

      .col-old,
      .col-new {
        width: auto;
      }

      .col-header-inner {
        display: flex;
        align-items: center;
        gap: 6px;

        &.old {
          color: var(--neutral-color-500);
          svg {
            color: var(--utility-400);
          }
        }

        &.new {
          color: var(--theme-green-600);
          svg {
            color: var(--theme-green-500);
          }
        }
      }

      .diff-table tbody tr {
        transition: background-color 0.15s ease;

        &:hover {
          background-color: var(--neutral-color-10);
        }
      }

      .diff-table tbody td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--neutral-color-100);
        vertical-align: middle;
      }

      /* Changed row highlight */
      .changed-row {
        .cell-old {
          background-color: rgba(255, 86, 86, 0.04);
        }
        .cell-new {
          background-color: var(--theme-green-50);
        }
      }

      .unchanged-row {
        .cell-value {
          color: var(--neutral-color-500);
        }
      }

      /* Field name */
      .field-name-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .change-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--theme-green-500);
        flex-shrink: 0;
        box-shadow: 0 0 0 3px var(--theme-green-50);
      }

      .field-key {
        font-weight: 500;
        color: var(--neutral-color-700);
      }

      .changed-row .field-key {
        color: var(--neutral-color-900);
        font-weight: 600;
      }

      /* Cell values */
      .cell-value {
        font-size: 13px;
        color: var(--neutral-color-700);
        word-break: break-word;
        line-height: 1.5;
      }

      .cell-value.removed {
        color: var(--utility-500);
        text-decoration: line-through;
        text-decoration-color: var(--utility-300);
      }

      .cell-value.added {
        color: var(--theme-green-700);
        font-weight: 600;
        background: var(--theme-green-50);
        padding: 2px 8px;
        border-radius: 4px;
        border-left: 3px solid var(--theme-green-500);
      }

      /* Avatar preview */
      .avatar-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .avatar-preview {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--neutral-color-200);
      }

      .changed-row .cell-new .avatar-preview {
        border-color: var(--theme-green-400);
        box-shadow: 0 0 0 3px var(--theme-green-50);
      }

      .new-badge {
        font-size: 10px;
        font-weight: 700;
        color: white;
        background: var(--theme-green-500);
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
      }

      /* Link cells */
      .link-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .file-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--brand-600);
        text-decoration: none;
        font-weight: 500;
        padding: 4px 10px;
        border-radius: 6px;
        background: var(--brand-50);
        transition: all 0.15s ease;

        &:hover {
          background: var(--brand-100);
          color: var(--brand-700);
        }

        svg {
          color: var(--brand-500);
        }
      }

      .file-link.new-link {
        background: var(--theme-green-50);
        color: var(--theme-green-700);

        &:hover {
          background: var(--theme-green-100);
        }

        svg {
          color: var(--theme-green-500);
        }
      }

      /* ========== Diff Footer / Legend ========== */
      .diff-footer {
        padding: 12px 24px;
        border-top: 1px solid var(--neutral-color-200);
        background: var(--neutral-color-10);
      }

      .diff-legend {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--neutral-color-500);
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.changed {
          background: var(--theme-green-500);
        }

        &.unchanged {
          background: var(--neutral-color-300);
        }
      }
    `,
  ],
})
export class DetailUpdateProfileComponent implements OnInit {
  @Input() data: UpdateProfileDetail = {
    senderFullName: '',
    createdDate: '',
    oldProfile: {} as ProfileData,
    newProfile: {} as ProfileData,
  };

  diffFields: DiffField[] = [];
  changedCount = 0;
  unchangedCount = 0;

  private readonly fieldLabels: Record<keyof ProfileData, string> = {
    fullName: 'Họ & Tên',
    dateOfBirth: 'Ngày sinh',
    phoneNumber: 'Số điện thoại',
    companyEmail: 'Email công ty',
    idNumber: 'Số CCCD/CMND',
    address: 'Địa chỉ',
    avatarUrl: 'Ảnh đại diện',
    cvUrl: 'CV',
    positionId: 'Vị trí',
    sysStatus: 'Trạng thái',
    userId: 'Mã nhân viên',
  };

  private readonly fieldTypes: Partial<Record<keyof ProfileData, 'link' | 'image'>> = {
    avatarUrl: 'image',
    cvUrl: 'link',
  };

  /** Fields to display in diff, in order */
  private readonly displayOrder: (keyof ProfileData)[] = [
    'fullName',
    'dateOfBirth',
    'phoneNumber',
    'companyEmail',
    'idNumber',
    'address',
    'avatarUrl',
    'cvUrl',
    'positionId',
    'sysStatus',
  ];

  ngOnInit(): void {
    this.buildDiff();
  }

  private buildDiff(): void {
    const oldP = this.data.oldProfile || ({} as ProfileData);
    const newP = this.data.newProfile || ({} as ProfileData);

    this.diffFields = this.displayOrder.map((key) => {
      const oldVal = (oldP as unknown as Record<string, string>)[key] || '';
      const newVal = (newP as unknown as Record<string, string>)[key] || '';
      const changed = oldVal !== newVal;

      return {
        label: this.fieldLabels[key] || key,
        key,
        oldValue: oldVal,
        newValue: newVal,
        changed,
        type: this.fieldTypes[key] || 'text',
      };
    });

    this.changedCount = this.diffFields.filter((f) => f.changed).length;
    this.unchangedCount = this.diffFields.filter((f) => !f.changed).length;
  }
}
