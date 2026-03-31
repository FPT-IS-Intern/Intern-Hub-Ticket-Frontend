import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '@goat-bravos/intern-hub-layout';
import { TicketService } from '../../services/ticket.service';
import { UserTicketDto, TicketTypeDto } from '../../models/ticket.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-ticket-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
  ],
  templateUrl: './user-ticket.page.html',
  styleUrl: './user-ticket.page.scss',
})
export class UserTicketPage implements OnInit {
  tickets: UserTicketDto[] = [];
  filteredTickets: UserTicketDto[] = [];
  ticketTypes: TicketTypeDto[] = [];
  selectedTicketType = '';
  selectedStatus = '';
  isLoading = false;

  statusOptions = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
  ];

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
      types: this.ticketService.getTicketTypes(),
    }).subscribe({
      next: (res) => {
        this.ticketTypes = res.types.data || [];
        this.loadMyTickets();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading ticket types:', err);
        this.isLoading = false;
      },
    });
  }

  loadMyTickets(): void {
    this.isLoading = true;
    this.ticketService
      .getMyTickets(this.selectedTicketType || undefined, this.selectedStatus || undefined)
      .subscribe({
        next: (res) => {
          this.tickets = res.data || [];
          this.filteredTickets = this.tickets;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading my tickets:', err);
          this.isLoading = false;
        },
      });
  }

  onFilterChange(): void {
    this.loadMyTickets();
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
    if (status === 'REJECTED') return 'var(--utility-color)';
    if (status === 'PENDING') return 'var(--secondary-color)';
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
    if (status === 'PENDING') return 'var(--secondary-100)';
    return 'var(--neutral-color-100)';
  }

  /**
   * Get the icon color for the approval status
   */
  getApprovalIconColor(status: 'SUCCESS' | 'PENDING' | 'REJECTED' | null): string {
    if (status === 'SUCCESS') return 'var(--theme-green-600)';
    if (status === 'REJECTED') return 'var(--utility-color)';
    if (status === 'PENDING') return 'var(--secondary-color)';
    return 'var(--neutral-color-500)';
  }

  /**
   * Check if a ticket has any approval info to display
   */
  hasApprovalInfo(ticket: UserTicketDto): boolean {
    return !!(ticket.approverFullNameLevel1 || ticket.approverFullNameLevel2);
  }
}
