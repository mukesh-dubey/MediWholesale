import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/business.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';

@Component({
  selector: 'app-staff-orders',
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
    <h1>Sales Orders</h1>
    <table mat-table [dataSource]="orders()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="order">
        <th mat-header-cell *matHeaderCellDef>Order #</th>
        <td mat-cell *matCellDef="let o">{{ o.orderNumber }}</td>
      </ng-container>
      <ng-container matColumnDef="customer">
        <th mat-header-cell *matHeaderCellDef>Customer</th>
        <td mat-cell *matCellDef="let o">{{ o.customerName }}</td>
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
        <td mat-cell *matCellDef="let o">
          <mat-chip>{{ o.status }}</mat-chip>
          @if (o.placedByCustomer) {
            <mat-chip color="accent">Portal</mat-chip>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let o">
          @if (o.status === 'Pending') {
            <button mat-button color="primary" (click)="dispatch(o)">Dispatch</button>
          }
          @if (o.status === 'Confirmed') {
            <button mat-button color="primary" (click)="dispatch(o)">Dispatch</button>
          }
          @if (
            o.status !== 'Completed' &&
            o.status !== 'Cancelled' &&
            o.status !== 'PartiallyDispatched' &&
            o.status !== 'Dispatched'
          ) {
            <button mat-button color="warn" (click)="cancel(o)">Cancel</button>
          }
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class StaffOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly orders = signal<Order[]>([]);
  readonly cols = ['order', 'customer', 'date', 'amount', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getOrders().subscribe((o) => this.orders.set(o));
  }

  dispatch(order: Order): void {
    this.api.updateOrderStatus(order.id, 'Dispatched').subscribe({
      next: () => {
        this.snack.open('Order dispatched and invoice generated', 'OK', { duration: 3000 });
        this.load();
      },
      error: (e) =>
        this.snack.open(e.error?.message ?? 'Failed to dispatch order', 'OK', { duration: 4000 }),
    });
  }

  cancel(order: Order): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel order',
        message: `Cancel order ${order.orderNumber}?`,
        confirmLabel: 'Cancel order',
        confirmColor: 'warn',
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.cancelOrder(order.id).subscribe({
        next: () => {
          this.snack.open('Order cancelled', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to cancel order', 'OK', { duration: 4000 }),
      });
    });
  }
}
