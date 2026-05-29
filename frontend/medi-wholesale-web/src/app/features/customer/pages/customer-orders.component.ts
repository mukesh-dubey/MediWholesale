import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/business.model';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [MatTableModule, MatChipsModule, CurrencyPipe, DatePipe],
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
        <td mat-cell *matCellDef="let o">{{ o.paymentStatus }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class CustomerOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly orders = signal<Order[]>([]);
  readonly cols = ['order', 'date', 'amount', 'status', 'payment'];

  ngOnInit(): void {
    this.api.getOrders().subscribe((o) => this.orders.set(o));
  }
}
