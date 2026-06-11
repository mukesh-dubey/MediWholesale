import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/business.model';
import { PaymentOptionsDialogComponent } from '../dialogs/payment-options-dialog.component';
import { PaymentProcessingDialogComponent } from '../dialogs/payment-processing-dialog.component';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <h1>My orders</h1>
    <table mat-table [dataSource]="orders()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="order">
        <th mat-header-cell *matHeaderCellDef>Order #</th>
        <td mat-cell *matCellDef="let o">{{ o.orderNumber }}</td>
      </ng-container>
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let o">{{ o.orderDate | date: 'short' }}</td>
      </ng-container>
      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef>Amount</th>
        <td mat-cell *matCellDef="let o">{{ o.totalAmount | currency: 'INR' }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let o"><mat-chip>{{ o.status }}</mat-chip></td>
      </ng-container>
      <ng-container matColumnDef="payment">
        <th mat-header-cell *matHeaderCellDef>Payment</th>
        <td mat-cell *matCellDef="let o">
          <mat-chip [color]="o.paymentStatus === 'Paid' ? 'accent' : 'warn'">
            {{ o.paymentStatus }}
          </mat-chip>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let o">
          @if (o.status === 'Confirmed' && o.paymentStatus !== 'Paid') {
            <button mat-button color="primary" (click)="payNow(o)">
              <mat-icon>payment</mat-icon>
              Pay Now
            </button>
          }
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class CustomerOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly orders = signal<Order[]>([]);
  readonly cols = ['order', 'date', 'amount', 'status', 'payment', 'actions'];

  ngOnInit(): void {
    this.api.getOrders().subscribe((o) => this.orders.set(o));
  }

  payNow(order: Order): void {
    // Step 1: Show payment method selection dialog
    const optionsRef = this.dialog.open(PaymentOptionsDialogComponent);

    optionsRef.afterClosed().subscribe((paymentMethod) => {
      if (!paymentMethod) return;

      // Step 2: Show payment processing dialog
      const processingRef = this.dialog.open(PaymentProcessingDialogComponent, {
        data: { order, paymentMethod },
        disableClose: true,
        width: '500px',
      });

      processingRef.afterClosed().subscribe((success) => {
        if (success) {
          this.snack.open('Payment successful! Invoice generated.', 'OK', { duration: 5000 });
          // Reload orders to refresh status
          this.api.getOrders().subscribe((o) => this.orders.set(o));
        }
      });
    });
  }
}
