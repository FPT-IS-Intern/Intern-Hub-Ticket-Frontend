import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketTypeDto, CreateTicketMultipartRequest } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';

import {
  IconComponent,
  ButtonContainerComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';

import { ExplanationFormComponent } from './components/explanation-form.component';
import { RemoteWfhFormComponent } from './components/remote-wfh-form.component';
import { RemoteOnsiteFormComponent } from './components/remote-onsite-form.component';
import { LeaveFormComponent } from './components/leave-form.component';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.docx'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ButtonContainerComponent,
    InputTextComponent,
    ExplanationFormComponent,
    RemoteWfhFormComponent,
    RemoteOnsiteFormComponent,
    LeaveFormComponent,
  ],
  templateUrl: './create-ticket.page.html',
  styleUrls: ['./create-ticket.page.scss'],
})
export class CreateTicketPage implements OnInit {
  currentForm!: FormGroup;
  isSubmitting = false;

  ticketTypesList: TicketTypeDto[] = [];
  selectedTicketTypeId: string | null = null;
  private readonly hiddenTicketTypeNames = new Set([
    'Phiếu Update Profile',
  ]);

  // Popup state
  showSuccessPopup = false;
  createdTicketId = '';
  showErrorPopup = false;
  errorMessage = '';

  private typeNameToComponentKey: Record<string, string> = {
    'Phiếu giải trình': 'EXPLANATION',
    'Phiếu Remote - WFH': 'REMOTE_WFH',
    'Phiếu Remote - Onsite': 'REMOTE_ONSITE',
    'Phiếu nghỉ phép': 'LEAVE',
    'Phiếu đăng tin tức': 'NEWS',
  };

  constructor(
    private router: Router,
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTicketTypes();
  }

  loadTicketTypes(): void {
    this.ticketService.getTicketTypes().subscribe({
      next: (res) => {
        this.ticketTypesList = res.data;
        const firstVisibleType = this.getVisibleTicketTypes()[0];
        if (firstVisibleType) {
          this.selectedTicketTypeId = firstVisibleType.ticketTypeId;
        } else {
          this.selectedTicketTypeId = null;
        }
      },
      error: (err) => {
        console.error('Error loading ticket types:', err);
      },
    });
  }

  getVisibleTicketTypes(): TicketTypeDto[] {
    return this.ticketTypesList.filter((type) => !this.hiddenTicketTypeNames.has(type.typeName));
  }

  onTicketTypeChange(): void {
    this.cdr.detectChanges();
  }

  onFormChange(form: FormGroup): void {
    this.currentForm = form;
  }

  isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.currentForm;
  }

  getTicketTypeLabel(): string {
    const type = this.ticketTypesList.find((t) => t.ticketTypeId === this.selectedTicketTypeId);
    return type ? type.typeName : '';
  }

  getSelectedComponentKey(): string {
    const type = this.ticketTypesList.find((t) => t.ticketTypeId === this.selectedTicketTypeId);
    if (!type) return '';
    return this.typeNameToComponentKey[type.typeName] || '';
  }

  /**
   * Validate a single file: checks extension and size.
   * Returns an error message string if invalid, null if valid.
   */
  private validateFile(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File "${file.name}" có định dạng không hợp lệ. Chỉ chấp nhận: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File "${file.name}" vượt quá kích thước tối đa 2MB`;
    }
    return null;
  }

  /**
   * Extract raw File objects from UploadedFile wrappers emitted by FileUploadDropzoneComponent.
   */
  private extractFiles(attachments: any[]): File[] {
    return attachments
      .filter((f: any) => f != null)
      .map((f: any) => f.file || f)
      .filter((f: any) => f instanceof File);
  }

  /**
   * Build the JSON payload for the multipart request.
   * Returns the ticketTypeId, payload, and extracted files separately.
   */
  buildPayload(): { ticketTypeId: string; payload: Record<string, any>; evidences: File[] } | null {
    if (!this.currentForm) {
      return null;
    }

    const rawValue = this.currentForm.getRawValue();
    const payload: Record<string, any> = { ...rawValue };
    const componentKey = this.getSelectedComponentKey();

    if (componentKey === 'EXPLANATION' && rawValue.date) {
      payload['date'] = this.formatDate(rawValue.date);
    }

    let totalDaysFromRange: number | null = null;

    if (rawValue.dateRange && rawValue.dateRange.length === 2) {
      const startDate = rawValue.dateRange[0];
      const endDate = rawValue.dateRange[1];

      if (componentKey === 'LEAVE' || componentKey === 'REMOTE_WFH' || componentKey === 'REMOTE_ONSITE') {
        payload['start_date'] = this.formatDate(startDate);
        payload['end_date'] = this.formatDate(endDate);
        totalDaysFromRange = this.calculateInclusiveDays(startDate, endDate);
      }
      delete payload['dateRange'];
    }

    if (componentKey === 'REMOTE_ONSITE') {
      if (payload['startTime'] !== undefined) {
        payload['start_time'] = payload['startTime'];
        delete payload['startTime'];
      }
      if (payload['endTime'] !== undefined) {
        payload['end_time'] = payload['endTime'];
        delete payload['endTime'];
      }
    }

    if (componentKey === 'LEAVE' || componentKey === 'REMOTE_WFH' || componentKey === 'REMOTE_ONSITE') {
      if (totalDaysFromRange != null) {
        payload['total_days'] = totalDaysFromRange;
      } else if (componentKey === 'LEAVE' && payload['totalDays'] !== undefined) {
        payload['total_days'] = payload['totalDays'];
      }
    }
    if (payload['totalDays'] !== undefined) {
      delete payload['totalDays'];
    }

    // Extract files from attachments field
    const evidences = this.extractFiles(rawValue['attachments'] || []);
    delete payload['attachments'];

    return {
      ticketTypeId: this.selectedTicketTypeId!,
      payload,
      evidences,
    };
  }

  onSubmit(): void {
    if (this.isSubmitDisabled()) {
      this.currentForm?.markAllAsTouched();
      return;
    }

    if (!this.currentForm || this.currentForm.invalid) {
      this.currentForm?.markAllAsTouched();
      console.error('Form is invalid');
      return;
    }

    const result = this.buildPayload();
    if (!result) {
      console.error('Could not build request payload');
      return;
    }

    const { ticketTypeId, payload, evidences } = result;

    // Validate file extensions and sizes
    for (const file of evidences) {
      const error = this.validateFile(file);
      if (error) {
        this.isSubmitting = false;
        alert(error);
        return;
      }
    }

    this.isSubmitting = true;

    // Build request matching backend CreateTicketRequest DTO
    // Backend expects: @RequestPart("request") CreateTicketRequest + @RequestPart("evidences") MultipartFile[]
    const request: CreateTicketMultipartRequest = { ticketTypeId, payload };
    console.log('Submitting ticket (multipart):', request, 'Evidences:', evidences);

    this.ticketService.createTicketMultipart(request, evidences).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Ticket created successfully:', res.data);
        this.createdTicketId = res.data.ticketId;
        this.showSuccessPopup = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating ticket:', err);

        const backendCode = err?.error?.status?.code;
        const backendMessage = err?.error?.status?.message || '';
        const isLocationInvalidError =
          backendCode === 'invalid.value' && /field\s+location/i.test(backendMessage);

        if (isLocationInvalidError) {
          const locationControl = this.currentForm?.get('location');
          if (locationControl) {
            const currentErrors = { ...(locationControl.errors || {}) };
            locationControl.setErrors({ ...currentErrors, invalidOption: true });
            locationControl.markAsTouched();
            locationControl.markAsDirty();
            this.currentForm?.markAsTouched();
          }
        }

        this.errorMessage =
          err?.error?.status?.message ||
          err?.error?.message ||
          err?.message ||
          'Đã xảy ra lỗi khi tạo phiếu. Vui lòng thử lại.';
        this.showErrorPopup = true;
      },
    });
  }

  goToHome() {
    this.router.navigate(['/homePage']);
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  confirmSuccessPopup(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/ticket/my-ticket']);
  }

  closeErrorPopup(): void {
    this.showErrorPopup = false;
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calculateInclusiveDays(startDate: any, endDate: any): number | null {
    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return null;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();

    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}


