import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../core/models/business.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [MatCardModule, CurrencyPipe, DatePipe],
  template: `
    <h1>Welcome, {{ auth.user()?.fullName }}</h1>
    <p>Place orders, track dispatch, and view invoices from your hospital/clinic account.</p>
    <h2>Recent orders</h2>
    @for (o of orders(); track o.id) {
      <mat-card class="order-card">
        <strong>{{ o.orderNumber }}</strong> · {{ o.orderDate | date: 'medium' }} ·
        {{ o.totalAmount | currency: 'INR' }} · {{ o.status }}
      </mat-card>
    } @empty {
      <p>No orders yet. Browse the catalog to place your first order.</p>
    }
  `,
  styles: `
    .order-card {
      margin-bottom: 0.75rem;
      padding: 1rem;
    }
  `,
})
export class CustomerHomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.api.getOrders().subscribe((o) => this.orders.set(o.slice(0, 5)));
  }
}
