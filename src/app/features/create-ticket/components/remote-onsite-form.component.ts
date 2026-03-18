import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent } from '@goat-bravos/intern-hub-layout';

@Component({
  selector: 'app-remote-onsite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, FileUploadDropzoneComponent, InputTextComponent],
  template: `
    <form [formGroup]="form" class="ticket-form">
      <!-- Date Range -->
      <div class="form-group full-width">
        <label>Ngày làm <span class="required">*</span></label>
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

      <!-- Start Time and End Time -->
      <div class="form-row">
        <div class="form-group">
          <app-input-text
            headerInput="Giờ làm"
            [required]="true"
            typeInput="time"
            formControlName="startTime"
          ></app-input-text>
        </div>
        <div class="form-group">
          <app-input-text
            headerInput="Giờ tan"
            [required]="true"
            typeInput="time"
            formControlName="endTime"
          ></app-input-text>
        </div>
      </div>

      <!-- Location -->
      <div class="form-group">
        <app-input-text
          headerInput="Địa điểm"
          [required]="true"
          [readonly]="true"
          [value]="(form.get('location')?.value === 'Hanoi' ? 'Hà Nội' :
                   form.get('location')?.value === 'HCM' ? 'TP. HCM' : '')"
          placeholder="Chọn địa điểm remote"
          icon="dsi-chevron-down-line"
        ></app-input-text>
        <select formControlName="location" class="form-control hidden-select">
          <option [ngValue]="null" disabled selected>Nhập địa điểm remote</option>
          <option value="Hanoi">Hà Nội</option>
          <option value="HCM">TP. HCM</option>
        </select>
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
export class RemoteOnsiteFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<FormGroup>();
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dateRange: [[], Validators.required],
      startTime: [null, Validators.required],
      endTime: [null, Validators.required],
      location: [null, Validators.required],
      attachments: [[]]
    });

    this.form.valueChanges.subscribe(() => {
      this.formChange.emit(this.form);
    });

    this.formChange.emit(this.form);
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
