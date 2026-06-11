import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Invoice } from '../../../core/models/business.model';
import { InvoiceDetailsDialogComponent } from '../../staff/dialogs/invoice-details-dialog.component';

@Component({
  selector: 'app-customer-invoices',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <h1>My Invoices</h1>
    @if (invoices().length === 0) {
      <div class="empty-state">
        <p>No invoices found.</p>
      </div>
    } @else {
      <table mat-table [dataSource]="invoices()" class="mat-elevation-z1 full-width">
        <ng-container matColumnDef="invoice">
          <th mat-header-cell *matHeaderCellDef>Invoice #</th>
          <td mat-cell *matCellDef="let i">{{ i.invoiceNumber }}</td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Order Date</th>
          <td mat-cell *matCellDef="let i">{{ i.invoiceDate | date: 'short' }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Total Amount</th>
          <td mat-cell *matCellDef="let i">{{ i.totalAmount | currency: 'INR' }}</td>
        </ng-container>
        <ng-container matColumnDef="paymentStatus">
          <th mat-header-cell *matHeaderCellDef>Payment Status</th>
          <td mat-cell *matCellDef="let i">
            <mat-chip [color]="i.paymentStatus === 'Paid' ? 'accent' : 'warn'">
              {{ i.paymentStatus }}
            </mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Invoice Status</th>
          <td mat-cell *matCellDef="let i">
            <mat-chip>{{ i.status }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let i">
            <button mat-button color="primary" (click)="viewDetails(i)">View Details</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    }
  `,
  styles: `
    .full-width {
      width: 100%;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
    }
  `,
})
export class CustomerInvoicesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly invoices = signal<Invoice[]>([]);
  readonly cols = ['invoice', 'date', 'amount', 'paymentStatus', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getInvoices().subscribe((invoices) => this.invoices.set(invoices));
  }

  viewDetails(invoice: Invoice): void {
    this.dialog.open(InvoiceDetailsDialogComponent, {
      data: invoice,
      width: '900px',
      maxHeight: '90vh',
    });
  }
}
