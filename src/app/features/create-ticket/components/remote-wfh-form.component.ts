import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatePickerComponent, FileUploadDropzoneComponent } from '@goat-bravos/intern-hub-layout';

const completeDateRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const dates = control.value;
  if (!Array.isArray(dates) || dates.length !== 2 || !dates[0] || !dates[1]) {
    return { incompleteDateRange: true };
  }
  return null;
};

const requiredTrimmedTextValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { required: true };
  }
  return null;
};

@Component({
  selector: 'app-remote-wfh-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePickerComponent, FileUploadDropzoneComponent],
  template: `
    <form [formGroup]="form" class="ticket-form">
      <!-- Date Range -->
      <div class="form-group full-width date-work">
        <label>Ngày làm <span class="required">*</span></label>
        <div class="date-range-picker">
          <app-date-picker
            [disabledDate]="disabledPastDate"
            [(ngModel)]="startDateValue"
            [ngModelOptions]="{standalone: true}"
            (dateChange)="onStartDateChange($event)"
            style="width: 100%;"
            height="40px">
          </app-date-picker>
          <span>&rarr;</span>
          <app-date-picker
            [disabledDate]="disabledEndDate"
            [(ngModel)]="endDateValue"
            [ngModelOptions]="{standalone: true}"
            (dateChange)="onEndDateChange($event)"
            style="width: 100%;"
            height="40px">
          </app-date-picker>
        </div>
        @if (dateError) {
          <div class="error-message">{{ dateError }}</div>
        }
        @if (showControlError('dateRange') && !dateError) {
          <div class="error-message">Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc</div>
        }
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
        @if (showControlError('reason')) {
          <div class="error-message">Vui lòng nhập lí do</div>
        }
      </div>

      <!-- Attachments -->
      <div class="form-group">
        <app-file-upload-dropzone
          label="Tải minh chứng"
          maxSize="2MB"
          acceptFormats=".png, .jpeg, .jpg, .pdf, .docx"
          helperText="Tối đa 2MB. Định dạng .png, .jpeg, .jpg, .pdf, .docx"
          (filesChange)="onFilesChange($event)"
        ></app-file-upload-dropzone>
      </div>
    </form>
  `,
  styleUrls: ['../create-ticket.page.scss']
})
export class RemoteWfhFormComponent implements OnInit, OnDestroy {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;
  dateError: string | null = null;
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dateRange: [[], [completeDateRangeValidator]],
      reason: [null, [Validators.required, requiredTrimmedTextValidator]],
      attachments: [[]]
    });

    // Watch dateRange for validation
    this.form.get('dateRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((dates: any[]) => {
        this.validateDateRange(dates);
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
    this.startDateValue = date;
    const currentRange = this.form.get('dateRange')?.value || [];
    const endDate = currentRange[1];

    // If end date exists and is before the new start date, reset end date
    if (date && endDate && new Date(endDate) < new Date(date)) {
      this.endDateValue = null;
      this.form.get('dateRange')?.setValue([date, null]);
    } else {
      this.form.get('dateRange')?.setValue([date, endDate]);
    }
    this.form.get('dateRange')?.markAsDirty();
    this.form.get('dateRange')?.markAsTouched();
  }

  onEndDateChange(date: Date | null) {
    this.endDateValue = date;
    const currentRange = this.form.get('dateRange')?.value || [];
    this.form.get('dateRange')?.setValue([currentRange[0], date]);
    this.form.get('dateRange')?.markAsDirty();
    this.form.get('dateRange')?.markAsTouched();
  }

  validateDateRange(dates: any[]): void {
    this.dateError = null;
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      const start = new Date(dates[0]);
      const end = new Date(dates[1]);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (end < start) {
        this.dateError = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
  }

  onFilesChange(files: any[]) {
    this.form.get('attachments')?.setValue(files);
    this.form.get('attachments')?.markAsDirty();
    this.form.get('attachments')?.markAsTouched();
  }

  showControlError(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty);
  }

  disabledPastDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  disabledEndDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (current < today) return true;

    // Disable dates before start date
    if (this.startDateValue) {
      const start = new Date(this.startDateValue);
      start.setHours(0, 0, 0, 0);
      return current < start;
    }
    return false;
  };
}
