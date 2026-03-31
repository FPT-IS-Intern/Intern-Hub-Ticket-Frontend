import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IconComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';
import { TicketService } from '../../services/ticket.service';
import {
  UserTicketDto,
  TicketStatus,
  TicketTypeDto,
} from '../../models/ticket.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-ticket-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    InputTextComponent,
  ],
  templateUrl: './user-ticket.page.html',
  styleUrl: './user-ticket.page.scss',
})
export class UserTicketPage implements OnInit {
  tickets: UserTicketDto[] = [];
  filteredTickets: UserTicketDto[] = [];
  ticketTypes: TicketTypeDto[] = [];
  ticketCode = '';
  selectedTicketType = '';
  isLoading = false;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly ticketService: TicketService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      myTickets: this.ticketService.getMyTickets(),
      types: this.ticketService.getTicketTypes(),
    }).subscribe({
      next: (res) => {
        this.tickets = res.myTickets.data || [];
        this.ticketTypes = res.types.data || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user tickets:', err);
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.tickets];

    if (this.ticketCode?.trim()) {
      const keyword = this.ticketCode.trim().toLowerCase();
      result = result.filter((t) =>
        t.ticketId.toLowerCase().includes(keyword),
      );
    }

    if (this.selectedTicketType) {
      result = result.filter(
        (t) => t.typeName === this.selectedTicketType,
      );
    }

    this.filteredTickets = result;
  }

  onSearchChange(value: string): void {
    this.ticketCode = value;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onTicketTypeChange(): void {
    this.applyFilters();
  }

  goToHome(): void {
    this.router.navigate(['/homePage']);
  }

  /**
   * Format timestamp (in ms, as string) to dd/MM/yyyy
   */
  formatDate(timestamp: string): string {
    if (!timestamp) return '—';
    const date = new Date(Number(timestamp));
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Get the border color CSS variable for a card based on its status
   */
  getCardBorderColor(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.APPROVED:
        return 'var(--theme-green-300)';
      case TicketStatus.REJECTED:
        return 'var(--utility-300)';
      case TicketStatus.PENDING:
        return 'var(--brand-300)';
      default:
        return 'var(--neutral-color-300)';
    }
  }

  /**
   * Get status label text in Vietnamese for approval level
   */
  getApprovalStatusLabel(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Từ chối';
    if (status === 'PENDING') return 'Chờ duyệt';
    return '';
  }

  /**
   * Get the color for the approval status text
   */
  getApprovalStatusColor(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'var(--theme-green-600)';
    if (status === 'REJECTED') return 'var(--utility-600)';
    if (status === 'PENDING') return 'var(--brand-500)';
    return 'var(--neutral-color-500)';
  }

  /**
   * Get the icon class for the approval status
   */
  getApprovalStatusIcon(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'dsi-check-circle-line';
    if (status === 'REJECTED') return 'dsi-x-circle-line';
    if (status === 'PENDING') return 'dsi-clock-line';
    return '';
  }

  /**
   * Get the icon background color for the approval status
   */
  getApprovalIconBg(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'var(--theme-green-100)';
    if (status === 'REJECTED') return 'var(--utility-100)';
    if (status === 'PENDING') return 'var(--brand-100)';
    return 'var(--neutral-color-100)';
  }

  /**
   * Get the icon color for the approval status
   */
  getApprovalIconColor(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'var(--theme-green-600)';
    if (status === 'REJECTED') return 'var(--utility-600)';
    if (status === 'PENDING') return 'var(--brand-600)';
    return 'var(--neutral-color-500)';
  }

  /**
   * Check if a ticket has any approval info to display
   */
  hasApprovalInfo(ticket: UserTicketDto): boolean {
    return !!(ticket.approverFullNameLevel1 || ticket.approverFullNameLevel2);
  }
}
