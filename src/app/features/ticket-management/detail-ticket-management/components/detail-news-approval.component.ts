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
    <div class="news-ticket-layout">
      <section class="news-ticket-section news-ticket-header">
        <div class="header-left">
          <span class="ticket-chip">Phiếu đăng tin tức</span>
          <h3 class="ticket-title">{{ data.title || 'Không có tiêu đề' }}</h3>
          <div class="ticket-meta">
            <span class="meta-item">Mã bài: <strong>{{ data.newsId || '-' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="meta-item">Người tạo: <strong>{{ data.senderFullName || '-' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="meta-item">Ngày tạo: <strong>{{ data.createdDate || '-' }}</strong></span>
          </div>
        </div>
      </section>

      <section class="news-ticket-section info-grid-section">
        <div class="info-grid">
          <div class="info-field">
            <div class="label">Mô tả ngắn</div>
            <div class="value">{{ data.summary || '-' }}</div>
          </div>
          <div class="info-field">
            <div class="label">Lý do đăng</div>
            <div class="value">{{ data.reason || '-' }}</div>
          </div>
          <div class="info-field">
            <div class="label">Danh mục</div>
            <div class="category-chips">
              @if (categories.length > 0) {
                @for (item of categories; track item) {
                  <span class="category-chip">{{ item }}</span>
                }
              } @else {
                <span class="value">-</span>
              }
            </div>
          </div>
          <div class="info-field">
            <div class="label">Số lượng ảnh</div>
            <div class="value strong">{{ data.imageUrls.length || 0 }}</div>
          </div>
        </div>

        <div class="image-section">
          <div class="label">Hình ảnh bài viết</div>
          @if (data.imageUrls.length) {
            <div class="image-grid">
              @for (url of data.imageUrls; track url) {
                <a class="image-link" [href]="url" target="_blank" rel="noopener">
                  <img [src]="url" alt="news image" class="image-preview" />
                </a>
              }
            </div>
          } @else {
            <div class="empty">Không có hình ảnh</div>
          }
        </div>
      </section>

      <section class="news-ticket-section content-section">
        <div class="section-title">Nội dung bài viết</div>
        @if (hasHtmlContent) {
          <div class="news-content-html" [innerHTML]="data.content"></div>
        } @else {
          <div class="empty">Không có nội dung</div>
        }
      </section>
    </div>
  `,
  styles: [`
    .news-ticket-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .news-ticket-section {
      border: 1px solid var(--neutral-color-200);
      border-radius: 14px;
      background: var(--neutral-color-10);
      padding: 18px 20px;
    }

    .news-ticket-header {
      display: flex;
      gap: 16px;
    }

    .header-left {
      min-width: 0;
    }

    .ticket-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--brand-200);
      background: var(--brand-10);
      color: var(--brand-700);
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .ticket-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.35;
      color: var(--neutral-color-800);
      word-break: break-word;
    }

    .ticket-meta {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      color: var(--neutral-color-600);
      font-size: 14px;
      line-height: 1.4;
    }

    .meta-item strong {
      color: var(--neutral-color-800);
      font-weight: 600;
    }

    .meta-dot {
      color: var(--neutral-color-300);
      font-size: 13px;
    }

    .info-grid-section {
      display: grid;
      gap: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px 20px;
    }

    .info-field {
      min-width: 0;
    }

    .label {
      font-size: 13px;
      font-weight: 500;
      color: var(--neutral-color-500);
      margin-bottom: 8px;
    }

    .value {
      color: var(--neutral-color-800);
      font-size: 15px;
      line-height: 1.55;
      word-break: break-word;
    }

    .value.strong {
      font-weight: 600;
    }

    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .category-chip {
      border-radius: 999px;
      border: 1px solid var(--neutral-color-200);
      background: var(--neutral-color-50);
      color: var(--neutral-color-700);
      font-size: 12px;
      font-weight: 500;
      padding: 4px 10px;
      line-height: 1.3;
    }

    .image-section {
      border-top: 1px dashed var(--neutral-color-200);
      padding-top: 16px;
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
      aspect-ratio: 4 / 3;
    }

    .image-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .content-section {
      padding: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--neutral-color-800);
      margin-bottom: 12px;
    }

    .news-content-html {
      border: 1px solid var(--neutral-color-200);
      border-radius: 12px;
      background: var(--neutral-color-10);
      padding: 18px;
      color: var(--neutral-color-800);
      line-height: 1.7;
      font-size: 15px;
      word-break: break-word;
    }

    .news-content-html :where(h1, h2, h3, h4) {
      margin: 0 0 12px;
      line-height: 1.4;
      color: var(--neutral-color-900);
    }

    .news-content-html :where(p, ul, ol, blockquote, table) {
      margin: 0 0 12px;
    }

    .news-content-html :where(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      margin: 10px auto;
    }

    .news-content-html :where(a) {
      color: var(--brand-600);
    }

    .empty {
      color: var(--neutral-color-500);
      font-size: 14px;
      line-height: 1.5;
    }

    @media (max-width: 1024px) {
      .image-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .news-ticket-header {
        flex-direction: column;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .image-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
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

  get categories(): string[] {
    const raw = (this.data.category || '').trim();
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item);
  }

  get hasHtmlContent(): boolean {
    return !!(this.data.content || '').trim();
  }
}
