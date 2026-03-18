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
              (dateChange)="onStartDateChange($event)"
              style="width: 100%;"
              height="40px">
            </app-date-picker>
            <span>&rarr;</span>
            <app-date-picker
              (dateChange)="onEndDateChange($event)"
              style="width: 100%;"
              height="40px">
            </app-date-picker>
          </div>
        </div>

        <div class="form-group">
          <app-input-text
            headerInput="Tổng ngày nghỉ"
            formControlName="totalDays"
            typeInput="number"
            [readonly]="true"
          ></app-input-text>
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
      dateRange: [[], Validators.required],
      totalDays: [{ value: 0, disabled: true }],
      reason: [null, Validators.required],
      attachments: [[]]
    });

    // Calculate total days when date range changes
    this.form.get('dateRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((dates: Date[]) => {
        if (dates && dates.length === 2 && dates[0] && dates[1]) {
          const diffTime = Math.abs(dates[1].getTime() - dates[0].getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          this.form.get('totalDays')?.setValue(diffDays);
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
}
