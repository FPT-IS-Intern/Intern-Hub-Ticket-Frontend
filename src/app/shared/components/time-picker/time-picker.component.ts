import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="time-picker-field">
      @if (headerInput) {
        <label class="time-picker-label">
          {{ headerInput }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }

      <div class="time-picker-input-wrapper" [class.disabled]="disabled">
        <i class="time-icon" aria-hidden="true"></i>
        <input
          class="time-picker-input"
          type="time"
          [value]="value"
          [disabled]="disabled"
          [step]="step"
          lang="vi-VN"
          (input)="onInput($event)"
          (blur)="onBlur.emit()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .time-picker-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .time-picker-label {
        font-weight: 500;
        color: var(--neutral-700);
      }

      .required {
        color: var(--error-500);
      }

      .time-picker-input-wrapper {
        width: 100%;
        height: 40px;
        border: 1px solid var(--neutral-color-300);
        border-radius: 8px;
        background: var(--neutral-color-10);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        transition: border-color 0.2s ease;
      }

      .time-picker-input-wrapper:focus-within {
        border-color: var(--brand-500);
      }

      .time-picker-input-wrapper.disabled {
        background: var(--neutral-50);
        cursor: not-allowed;
      }

      .time-icon {
        color: var(--neutral-500);
        font-size: 16px;
        line-height: 1;
      }

      .time-picker-input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 14px;
        color: var(--neutral-700);
        background: transparent;
      }

      .time-picker-input:disabled {
        cursor: not-allowed;
      }
    `,
  ],
})
export class TimePickerComponent {
  @Input() headerInput = '';
  @Input() required = false;
  @Input() value = '';
  @Input() disabled = false;
  @Input() step = 60;

  @Output() valueChange = new EventEmitter<string>();
  @Output() onBlur = new EventEmitter<void>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const rawValue = target?.value || '';

    if (!rawValue) {
      this.valueChange.emit('');
      return;
    }

    // Always emit 24-hour HH:mm value.
    const [hourRaw, minuteRaw] = rawValue.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      this.valueChange.emit('');
      return;
    }

    const normalized = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    this.valueChange.emit(normalized);
  }
}
