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
import { DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent } from '@goat-bravos/intern-hub-layout';
import { WorkLocationService } from '../../../services/work-location.service';
import { TimePickerComponent } from '../../../shared/components/time-picker/time-picker.component';

const completeDateRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const dates = control.value;
  if (!Array.isArray(dates) || dates.length !== 2 || !dates[0] || !dates[1]) {
    return { incompleteDateRange: true };
  }
  return null;
};

@Component({
  selector: 'app-remote-onsite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent, TimePickerComponent],
  template: `
    <form [formGroup]="form" class="ticket-form">
      <div class="onsite-grid">
        <!-- Date Range -->
        <div class="form-group">
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

        <div class="form-group">
          <app-time-picker
            headerInput="Giờ làm"
            [required]="true"
            [value]="form.get('startTime')?.value || ''"
            (valueChange)="onTimeInputChange('startTime', $event)"
          ></app-time-picker>
          @if (showControlError('startTime')) {
            <div class="error-message">{{ getControlErrorMessage('startTime') }}</div>
          }
        </div>

        <div class="form-group">
          <app-time-picker
            headerInput="Giờ tan"
            [required]="true"
            [value]="form.get('endTime')?.value || ''"
            (valueChange)="onTimeInputChange('endTime', $event)"
          ></app-time-picker>
          @if (showControlError('endTime')) {
            <div class="error-message">{{ getControlErrorMessage('endTime') }}</div>
          }
        </div>

        <div class="form-group">
          <app-input-text
            headerInput="Địa điểm"
            [required]="true"
            [readonly]="true"
            [value]="getSelectedLocationName()"
            placeholder="Nhập địa điểm remote"
            icon="dsi-chevron-down-line"
          ></app-input-text>
          <select formControlName="location" class="form-control hidden-select">
            <option [ngValue]="null" disabled selected>Nhập địa điểm remote</option>
            @for (loc of locations; track loc) {
              <option [value]="loc">{{ loc }}</option>
            }
          </select>
          @if (showControlError('location')) {
            <div class="error-message">{{ getLocationErrorMessage() }}</div>
          }
        </div>
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
  styleUrls: ['../create-ticket.page.scss'],
  styles: [
    `
      .onsite-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        align-items: start;
      }

      @media (max-width: 900px) {
        .onsite-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ]
})
export class RemoteOnsiteFormComponent implements OnInit, OnDestroy {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;
  locations: string[] = [];
  dateError: string | null = null;
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private workLocationService: WorkLocationService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dateRange: [[], [completeDateRangeValidator]],
      startTime: [null, Validators.required],
      endTime: [null, Validators.required],
      location: [null, Validators.required],
      attachments: [[]]
    });

    this.loadLocations();

    // Watch dateRange for validation
    this.form.get('dateRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((dates: any[]) => {
        this.validateDateRange(dates);
      });

    this.form.get('startTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.normalizeTimeControlValue('startTime', value);
        this.validateTimeRange();
      });

    this.form.get('endTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.normalizeTimeControlValue('endTime', value);
        this.validateTimeRange();
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

  loadLocations(): void {
    this.workLocationService.getAllLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
      },
      error: (err) => {
        console.error('Error loading work locations:', err);
      },
    });
  }

  getSelectedLocationName(): string {
    const location = this.form.get('location')?.value;
    return location || '';
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
  }

  onEndDateChange(date: Date | null) {
    this.endDateValue = date;
    const currentRange = this.form.get('dateRange')?.value || [];
    this.form.get('dateRange')?.setValue([currentRange[0], date]);
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
    this.form.get('attachments')?.markAsTouched();
  }

  onTimeInputChange(controlName: 'startTime' | 'endTime', value: string): void {
    const normalized = value?.trim() || '';
    const control = this.form.get(controlName);
    control?.setValue(normalized);
    control?.markAsDirty();
    control?.markAsTouched();
  }

  showControlError(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty);
  }

  getControlErrorMessage(controlName: 'startTime' | 'endTime'): string {
    const control = this.form.get(controlName);
    const errors = control?.errors || {};

    if (errors['required']) {
      return controlName === 'startTime' ? 'Vui lòng chọn giờ làm' : 'Vui lòng chọn giờ tan';
    }

    if (errors['invalidTime']) {
      return 'Định dạng giờ chưa hợp lệ, vui lòng chọn theo 24 giờ (HH:mm)';
    }

    if (errors['endBeforeStart']) {
      return 'Giờ tan làm không được trước giờ vào làm';
    }

    return 'Dữ liệu chưa hợp lệ';
  }

  getLocationErrorMessage(): string {
    const errors = this.form.get('location')?.errors || {};

    if (errors['required']) {
      return 'Vui lòng chọn địa điểm';
    }

    if (errors['invalidOption']) {
      return 'Địa điểm này chưa được hỗ trợ cho phiếu Remote Onsite, vui lòng chọn địa điểm khác';
    }

    return 'Địa điểm chưa hợp lệ';
  }

  private validateTimeRange(): void {
    const startControl = this.form.get('startTime');
    const endControl = this.form.get('endTime');
    const startTime = startControl?.value;
    const endTime = endControl?.value;

    const startMinutes = startTime ? this.parseTimeToMinutes(startTime) : null;
    const endMinutes = endTime ? this.parseTimeToMinutes(endTime) : null;

    this.setControlCustomError('startTime', 'invalidTime', !!startTime && startMinutes === null);
    this.setControlCustomError('endTime', 'invalidTime', !!endTime && endMinutes === null);

    if (!startTime || !endTime || startMinutes === null || endMinutes === null) {
      this.setControlCustomError('endTime', 'endBeforeStart', false);
      return;
    }

    this.setControlCustomError('endTime', 'endBeforeStart', endMinutes < startMinutes);
  }

  private normalizeTimeControlValue(controlName: 'startTime' | 'endTime', value: string | null): void {
    if (!value) {
      return;
    }

    const normalized = value.trim();

    if (normalized !== value) {
      this.form.get(controlName)?.setValue(normalized, { emitEvent: false });
    }
  }

  private setControlCustomError(
    controlName: 'startTime' | 'endTime',
    key: 'invalidTime' | 'endBeforeStart',
    enabled: boolean,
  ): void {
    const control = this.form.get(controlName);
    if (!control) return;

    const currentErrors = { ...(control.errors || {}) };

    if (enabled) {
      currentErrors[key] = true;
      control.setErrors(currentErrors);
      return;
    }

    if (currentErrors[key]) {
      delete currentErrors[key];
    }

    control.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
  }

  private parseTimeToMinutes(timeValue: string): number | null {
    if (!timeValue) {
      return null;
    }

    const normalized = timeValue.trim();
    const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*:?\s*(SA|CH|AM|PM))?$/i);
    if (!match) {
      return null;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) {
      return null;
    }

    if (meridiem) {
      if (hour < 1 || hour > 12) {
        return null;
      }

      const isPm = meridiem === 'CH' || meridiem === 'PM';
      if (isPm && hour !== 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }
    } else if (hour < 0 || hour > 23) {
      return null;
    }

    return hour * 60 + minute;
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

