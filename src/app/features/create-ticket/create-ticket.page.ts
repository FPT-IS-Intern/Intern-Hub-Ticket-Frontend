import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateTicketRequest, TicketTypeDto } from '../../models/ticket.model';
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

  /** Ticket types loaded from the API */
  ticketTypesList: TicketTypeDto[] = [];

  /** Currently selected ticket type ID (string serialized from Long) */
  selectedTicketTypeId = '';

  /**
   * Maps typeName from DB to the component switch key used in the template.
   * Adjust these keys if the DB typeName values differ.
   */
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

  /**
   * Fetch ticket types from backend and set default selection
   */
  loadTicketTypes(): void {
    this.ticketService.getTicketTypes().subscribe({
      next: (res) => {
        this.ticketTypesList = res.data;
        if (this.ticketTypesList.length > 0) {
          this.selectedTicketTypeId = this.ticketTypesList[0].ticketTypeId;
        }
      },
      error: (err) => {
        console.error('Error loading ticket types:', err);
      },
    });
  }

  onTicketTypeChange(): void {
    console.log('Ticket type changed to:', this.selectedTicketTypeId);
    this.cdr.detectChanges();
  }

  onFormChange(form: FormGroup): void {
    this.currentForm = form;
  }

  getTicketTypeLabel(): string {
    const type = this.ticketTypesList.find((t) => t.ticketTypeId === this.selectedTicketTypeId);
    return type ? type.typeName : '';
  }

  /**
   * Get the component switch key for the currently selected ticket type.
   * Used by the template @switch to render the correct form component.
   */
  getSelectedComponentKey(): string {
    const type = this.ticketTypesList.find((t) => t.ticketTypeId === this.selectedTicketTypeId);
    if (!type) return '';
    return this.typeNameToComponentKey[type.typeName] || '';
  }

  /**
   * Build the request body matching the backend API:
   * { ticketTypeId: number, payload: { ...formData } }
   */
  buildPayload(): CreateTicketRequest | null {
    if (!this.currentForm) {
      return null;
    }

    const rawValue = this.currentForm.getRawValue();
    const payload: Record<string, any> = { ...rawValue };
    const componentKey = this.getSelectedComponentKey();

    // Handle date range conversion based on ticket type
    if (rawValue.dateRange && rawValue.dateRange.length === 2) {
      const startDate = rawValue.dateRange[0];
      const endDate = rawValue.dateRange[1];

      if (componentKey === 'LEAVE') {
        // Backend expects yyyy-MM-dd format with snake_case keys
        payload['start_date'] = this.formatDate(startDate);
        payload['end_date'] = this.formatDate(endDate);
      } else if (componentKey === 'REMOTE_WFH' || componentKey === 'REMOTE_ONSITE') {
        payload['workDate'] = this.formatDate(startDate);
      }
      delete payload['dateRange'];
    }

    // Convert totalDays to snake_case for LEAVE tickets
    if (componentKey === 'LEAVE' && payload['totalDays'] !== undefined) {
      payload['total_days'] = payload['totalDays'];
      delete payload['totalDays'];
    } else if (payload['totalDays'] !== undefined) {
      delete payload['totalDays'];
    }
    // Extract attachments and convert to evidences for the request
    const attachments = payload['attachments'] || [];
    delete payload['attachments'];

    // Build evidences array from uploaded files
    const evidences = attachments
      .filter((file: any) => file != null)
      .map((file: any) => ({
        evidenceKey: this.parseFileSize(file.size || file.fileSize || 0),
        fileType: file.type || file.fileType || 'application/octet-stream',
        fileSize: this.parseFileSize(file.size || file.fileSize || 0),
      }));

    return {
      ticketTypeId: Number(this.selectedTicketTypeId),
      payload,
      ...(evidences.length > 0 ? { evidences } : {}),
    };
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    if (!this.currentForm || this.currentForm.invalid) {
      this.currentForm?.markAllAsTouched();
      console.error('Form is invalid');
      return;
    }

    const request = this.buildPayload();
    if (!request) {
      console.error('Could not build request payload');
      return;
    }

    this.isSubmitting = true;
    console.log('Submitting ticket:', request);

    this.ticketService.createTicket(request).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Ticket created successfully:', res.data);
        alert(
          `Tạo phiếu thành công! Mã phiếu: ${res.data.ticketId}, Trạng thái: ${res.data.status}`,
        );
        this.goToHome();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating ticket:', err);
        const errorMsg = err?.error?.message || 'Đã xảy ra lỗi khi tạo phiếu. Vui lòng thử lại.';
        alert(errorMsg);
      },
    });
  }

  goToHome() {
    this.router.navigate(['/homePage']);
  }

  /**
   * Format a Date object to 'yyyy-MM-dd' string.
   */
  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
    /**
     * Parse a file size value to bytes (number).
     * Handles both raw numbers and formatted strings like "35.78KB", "2MB".
     */
  }
  private parseFileSize(size: any): number {
    if (typeof size === 'number') return Math.round(size);
    if (typeof size !== 'string') return 0;

    const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };
    return Math.round(value * (multipliers[unit] || 1));
  }
}
