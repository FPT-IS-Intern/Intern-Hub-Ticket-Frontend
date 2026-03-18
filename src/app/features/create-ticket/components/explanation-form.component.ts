import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent, FileUploadDropzoneComponent } from '@goat-bravos/intern-hub-layout';

@Component({
  selector: 'app-explanation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, FileUploadDropzoneComponent],
  template: `
    <form [formGroup]="form" class="ticket-form" style="gap: 16px">
      <!-- Date -->
      <div class="form-group">
        <label>Thời gian <span class="required">*</span></label>
        <app-date-picker formControlName="date" style="width: 100%;" height="40px"></app-date-picker>
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
export class ExplanationFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: [null, Validators.required],
      reason: [null, Validators.required],
      attachments: [[]]
    });

    this.form.valueChanges.subscribe(() => {
      this.formChange.emit(this.form);
    });

    this.formChange.emit(this.form);
  }

  onFilesChange(files: any[]) {
    this.form.get('attachments')?.setValue(files);
  }
}
