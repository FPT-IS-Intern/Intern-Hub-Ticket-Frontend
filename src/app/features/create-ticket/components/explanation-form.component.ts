import { Component, Output, EventEmitter, OnInit } from '@angular/core';
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
import { DatePickerComponent, FileUploadDropzoneComponent } from '@goat-bravos/intern-hub-layout';

const requiredAttachmentValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const files = control.value;
  if (!Array.isArray(files) || files.length === 0) {
    return { required: true };
  }
  return null;
};

@Component({
  selector: 'app-explanation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePickerComponent, FileUploadDropzoneComponent],
  template: `
    <form [formGroup]="form" class="ticket-form" style="gap: 16px">
      <!-- Date -->
      <div class="form-group">
        <label>Thời gian <span class="required">*</span></label>
        <app-date-picker
          [disabledDate]="disabledPastDate"
          [(ngModel)]="selectedDateValue"
          [ngModelOptions]="{standalone: true}"
          (dateChange)="onDateChange($event)"
          style="width: 100%;"
          height="40px">
        </app-date-picker>
        @if (showControlError('date')) {
          <div class="error-message">Vui lòng chọn thời gian</div>
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
        <label>Tải minh chứng <span class="required">*</span></label>
        <app-file-upload-dropzone
          label=""
          maxSize="2MB"
          acceptFormats=".png, .jpeg, .jpg, .pdf, .docx"
          helperText="Tối đa 2MB. Định dạng .png, .jpeg, .jpg, .pdf, .docx"
          (filesChange)="onFilesChange($event)"
        ></app-file-upload-dropzone>
        @if (showControlError('attachments')) {
          <div class="error-message">Vui lòng tải ít nhất 1 file minh chứng</div>
        }
      </div>
    </form>
  `,
  styleUrls: ['../create-ticket.page.scss']
})
export class ExplanationFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;
  selectedDateValue: Date | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: [null, Validators.required],
      reason: [null, Validators.required],
      attachments: [[], [requiredAttachmentValidator]]
    });

    this.form.valueChanges.subscribe(() => {
      this.formChange.emit(this.form);
    });

    this.formChange.emit(this.form);
  }

  onDateChange(date: Date | null) {
    this.selectedDateValue = date;
    this.form.get('date')?.setValue(date);
    this.form.get('date')?.markAsDirty();
    this.form.get('date')?.markAsTouched();
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
    today.setHours(23, 59, 59, 999);
    return current > today;
  };
}
