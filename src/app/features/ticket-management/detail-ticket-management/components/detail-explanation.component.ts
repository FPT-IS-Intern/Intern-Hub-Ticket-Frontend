import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ExplanationDetail {
  fullName: string;
  createdDate: string;
  date: string;
  reason: string;
}

@Component({
  selector: 'app-detail-explanation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-info-grid">
      <div class="detail-row">
        <div class="detail-field">
          <span class="field-label">H&#7885; &amp; T&ecirc;n</span>
          <span class="field-value bold">{{ data.fullName || '-' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Ng&agrave;y t&#7841;o phi&#7871;u</span>
          <span class="field-value">{{ data.createdDate || '-' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Ng&agrave;y gi&#7843;i tr&igrave;nh</span>
          <span class="field-value bold">{{ data.date || '-' }}</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-field">
          <span class="field-label">L&yacute; do</span>
          <span class="field-value">{{ data.reason || '-' }}</span>
        </div>
        <div class="detail-field"></div>
        <div class="detail-field"></div>
      </div>
    </div>
  `,
  styles: [
    `
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
      }
      .field-value.bold {
        font-weight: 600;
      }
    `,
  ],
})
export class DetailExplanationComponent {
  @Input() data: ExplanationDetail = {
    fullName: '',
    createdDate: '',
    date: '',
    reason: '',
  };
}
