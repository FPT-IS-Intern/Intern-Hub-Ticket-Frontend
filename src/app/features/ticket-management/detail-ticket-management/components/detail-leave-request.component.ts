import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LeaveRequestDetail {
  senderFullName: string;
  createdDate: string;
  startDate: string;
  endDate: string;
  reason: string;
  totalDays: number;
}

@Component({
  selector: 'app-detail-leave-request',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-info-grid">
      <div class="detail-row">
        <div class="detail-field">
          <span class="field-label">Họ & Tên</span>
          <span class="field-value bold">{{ data.senderFullName }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Ngày tạo phiếu</span>
          <span class="field-value">{{ data.createdDate }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Tổng ngày nghỉ</span>
          <span class="field-value bold">{{ data.totalDays }} ngày</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-field">
          <span class="field-label">Ngày bắt đầu</span>
          <span class="field-value bold">{{ data.startDate }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Ngày kết thúc</span>
          <span class="field-value bold">{{ data.endDate }}</span>
        </div>
      </div>
      <div class="detail-row full-width">
        <div class="detail-field">
          <span class="field-label">Lý do</span>
          <span class="field-value">{{ data.reason }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-info-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px 24px;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;

      &.full-width {
        grid-template-columns: 1fr;
      }
    }
    .detail-field {
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
      word-break: break-word;
    }
    .field-value.bold {
      font-weight: 600;
    }
  `]
})
export class DetailLeaveRequestComponent {
  @Input() data: LeaveRequestDetail = {
    senderFullName: '',
    createdDate: '',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0,
  };
}
