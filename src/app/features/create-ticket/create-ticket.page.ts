import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketType } from '../../models/ticket.model';
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
    LeaveFormComponent
  ],
  templateUrl: './create-ticket.page.html',
  styleUrls: ['./create-ticket.page.scss'],
})
export class CreateTicketPage implements OnInit {
  selectedTicketType: TicketType = TicketType.EXPLANATION;
  currentForm!: FormGroup;

  ticketTypesList = [
    { label: 'Phiếu giải trình', value: TicketType.EXPLANATION },
    { label: 'Phiếu Remote - WFH', value: TicketType.REMOTE_WFH },
    { label: 'Phiếu Remote - Onsite', value: TicketType.REMOTE_ONSITE },
    { label: 'Phiếu nghỉ phép', value: TicketType.LEAVE },
  ];

  constructor(
    private router: Router,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    // Initialization handled by child components
  }

  onTicketTypeChange(): void {
    // Form will be reset automatically when component changes
    console.log('Ticket type changed to:', this.selectedTicketType);
  }

  onFormChange(form: FormGroup): void {
    this.currentForm = form;
  }

  getTicketTypeLabel(): string {
    const type = this.ticketTypesList.find(t => t.value === this.selectedTicketType);
    return type ? type.label : '';
  }

  buildPayload() {
    if (!this.currentForm) {
      return null;
    }

    const rawValue = this.currentForm.getRawValue();
    const payload: any = { ...rawValue };

    // Handle date range conversion
    if (rawValue.dateRange && rawValue.dateRange.length === 2) {
      payload.startDate = rawValue.dateRange[0];
      payload.endDate = rawValue.dateRange[1];
      delete payload.dateRange;
    }

    return {
      ticketTypeId: this.selectedTicketType,
      ...payload,
    };
  }

  onSubmit(): void {
    if (!this.currentForm || this.currentForm.invalid) {
      console.error('Form is invalid');
      return;
    }

    const request = this.buildPayload();
    console.log('Submitting ticket:', request);

    // Call TicketService (place for API integration)
    this.ticketService.createTicket(request).subscribe({
      next: (res) => {
        console.log('Ticket created successfully', res);
        this.goToHome();
      },
      error: (err) => {
        console.error('Error creating ticket', err);
      },
    });
  }

  goToHome() {
    this.router.navigate(['/homePage']);
  }
}
