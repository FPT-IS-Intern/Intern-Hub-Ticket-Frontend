import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent } from '@goat-bravos/intern-hub-layout';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent],
  template: `
    <form [formGroup]="form" class="ticket-form">
      <!-- Date Range and Total Days -->
      <div class="form-row">
        <div class="form-group full-width">
          <label>Thời gian nghỉ <span class="required">*</span></label>
          <div class="date-range-picker">
            <app-date-picker
              [disabledDate]="disabledPastDate"
              (dateChange)="onStartDateChange($event)"
              style="width: 100%;"
              height="40px">
            </app-date-picker>
            <span>&rarr;</span>
            <app-date-picker
              [disabledDate]="disabledPastDate"
              (dateChange)="onEndDateChange($event)"
              style="width: 100%;"
              height="40px">
            </app-date-picker>
          </div>
        </div>

        <div class="form-group" style="display: flex; flex-direction: column;">
          <label>Tổng ngày nghỉ<span class="required">*</span></label>
          <app-input-text
            formControlName="totalDays"
            typeInput="number"
            [readonly]="true"
          ></app-input-text>
          @if (form.get('totalDays')?.value >= 7) {
            <div class="info-message" style="color: var(--brand-600); font-size: 12px; margin-top: 4px;">
              Vì tổng ngày nghỉ của bạn lớn hơn 5 ngày, đơn này sẽ do mentor duyệt và ban quản lý sẽ duyệt cuối
            </div>
          }
        </div>
      </div>

      <!-- Reason -->
      <div class="form-group">
        <label>Lí do <span class="required">*</span></label>
        <textarea
          formControlName="reason"
          class="form-control"
          placeholder="Nhập lí do"
          maxlength="255"
        ></textarea>
        <div class="char-count">{{ form.get('reason')?.value?.length || 0 }}/255</div>
      </div>

      <!-- Attachments -->
      <div class="form-group">
        <app-file-upload-dropzone
          label="Tải minh chứng"
          maxSize="2MB"
          acceptFormats=".png, .jpeg, .jpg"
          helperText="Tối đa 2MB. Định dạng .png, .jpeg, .jpg"
          (filesChange)="onFilesChange($event)"
        ></app-file-upload-dropzone>
      </div>
    </form>
  `,
  styleUrls: ['../create-ticket.page.scss']
})
export class LeaveFormComponent implements OnInit, OnDestroy {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dateRange: [[null, null], Validators.required],
      totalDays: [{ value: 0, disabled: false }],
      reason: [null, Validators.required],
      attachments: [[]]
    });

    // Calculate total days when date range changes
    this.form.get('dateRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((dates: any[]) => {
        if (dates && dates.length === 2 && dates[0] && dates[1]) {
          const start = new Date(dates[0]);
          const end = new Date(dates[1]);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          this.form.get('totalDays')?.setValue(diffDays);
        } else {
          this.form.get('totalDays')?.setValue(0);
        }
      });

    this.form.valueChanges.subscribe(() => {
      this.formChange.emit(this.form);
    });

    this.formChange.emit(this.form);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartDateChange(date: Date | null) {
    const currentRange = this.form.get('dateRange')?.value || [];
    this.form.get('dateRange')?.setValue([date, currentRange[1]]);
  }

  onEndDateChange(date: Date | null) {
    const currentRange = this.form.get('dateRange')?.value || [];
    this.form.get('dateRange')?.setValue([currentRange[0], date]);
  }

  onFilesChange(files: any[]) {
    this.form.get('attachments')?.setValue(files);
  }

  disabledPastDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };
}
