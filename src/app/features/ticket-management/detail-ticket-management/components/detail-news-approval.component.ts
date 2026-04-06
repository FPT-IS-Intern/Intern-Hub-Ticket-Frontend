import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NewsApprovalDetail {
  senderFullName: string;
  createdDate: string;
  newsId: string;
  title: string;
  summary: string;
  category: string;
  reason: string;
  content: string;
  previewUrl: string;
  imageUrls: string[];
}

@Component({
  selector: 'app-detail-news-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="news-detail-grid">
      <div class="news-row">
        <div class="news-field">
          <span class="field-label">Họ &amp; Tên</span>
          <span class="field-value strong">{{ data.senderFullName || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Ngày tạo phiếu</span>
          <span class="field-value strong">{{ data.createdDate || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Mã bài viết</span>
          <span class="field-value strong">{{ data.newsId || '-' }}</span>
        </div>
      </div>

      <div class="news-row">
        <div class="news-field">
          <span class="field-label">Tiêu đề</span>
          <span class="field-value">{{ data.title || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Danh mục</span>
          <span class="field-value">{{ data.category || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Link xem trước</span>
          @if (data.previewUrl) {
            <a class="field-link" [href]="data.previewUrl" target="_blank" rel="noopener">Mở preview</a>
          } @else {
            <span class="field-value">-</span>
          }
        </div>
      </div>

      <div class="news-row">
        <div class="news-field">
          <span class="field-label">Tóm tắt</span>
          <span class="field-value">{{ data.summary || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Lý do đăng</span>
          <span class="field-value">{{ data.reason || '-' }}</span>
        </div>
        <div class="news-field">
          <span class="field-label">Nội dung</span>
          <span class="field-value clamp-3">{{ data.content || '-' }}</span>
        </div>
      </div>

      <div class="news-images">
        <div class="field-label">Hình ảnh bài viết</div>
        @if (data.imageUrls.length) {
          <div class="image-grid">
            @for (url of data.imageUrls; track url) {
              <a class="image-link" [href]="url" target="_blank" rel="noopener">
                <img [src]="url" alt="news image" class="image-preview" />
              </a>
            }
          </div>
        } @else {
          <div class="empty-image">Không có hình ảnh</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .news-detail-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .news-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
    }

    .news-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .field-label {
      font-size: 14px;
      color: var(--neutral-color-500);
      font-weight: 400;
    }

    .field-value {
      font-size: 16px;
      color: var(--neutral-color-700);
      word-break: break-word;
      line-height: 1.5;
    }

    .field-value.strong {
      font-weight: 600;
    }

    .field-link {
      color: var(--brand-600);
      font-size: 15px;
      text-decoration: underline;
      width: fit-content;
    }

    .clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-images {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 6px;
    }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .image-link {
      display: block;
      border: 1px solid var(--neutral-color-200);
      border-radius: 10px;
      overflow: hidden;
      background: var(--neutral-color-10);
    }

    .image-preview {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    }

    .empty-image {
      font-size: 14px;
      color: var(--neutral-color-500);
    }
  `],
})
export class DetailNewsApprovalComponent {
  @Input() data: NewsApprovalDetail = {
    senderFullName: '',
    createdDate: '',
    newsId: '',
    title: '',
    summary: '',
    category: '',
    reason: '',
    content: '',
    previewUrl: '',
    imageUrls: [],
  };
}
