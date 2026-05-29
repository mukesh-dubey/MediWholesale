import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { Dashboard } from '../../../core/models/business.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, CurrencyPipe],
  template: `
    <h1>Dashboard</h1>
    @if (stats(); as s) {
      <div class="grid">
        <mat-card><mat-icon>groups</mat-icon><h2>{{ s.totalCustomers }}</h2><p>Active customers</p></mat-card>
        <mat-card><mat-icon>medication</mat-icon><h2>{{ s.totalProducts }}</h2><p>Products</p></mat-card>
        <mat-card><mat-icon>warning</mat-icon><h2>{{ s.lowStockBatches }}</h2><p>Low stock batches</p></mat-card>
        <mat-card><mat-icon>schedule</mat-icon><h2>{{ s.expiringBatches }}</h2><p>Expiring in 90 days</p></mat-card>
        <mat-card><mat-icon>pending_actions</mat-icon><h2>{{ s.pendingOrders }}</h2><p>Pending orders</p></mat-card>
        <mat-card><mat-icon>payments</mat-icon><h2>{{ s.outstandingAmount | currency: 'INR' }}</h2><p>Outstanding</p></mat-card>
      </div>
    }
  `,
  styles: `
    h1 {
      margin-bottom: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    mat-card {
      padding: 1rem;
      text-align: center;
    }
    h2 {
      margin: 0.5rem 0;
      font-size: 2rem;
    }
    p {
      color: #666;
      margin: 0;
    }
  `,
})
export class StaffDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<Dashboard | null>(null);

  ngOnInit(): void {
    this.api.getDashboard().subscribe((s) => this.stats.set(s));
  }
}
