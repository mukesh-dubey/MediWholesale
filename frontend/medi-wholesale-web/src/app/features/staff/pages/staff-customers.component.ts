import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../../../core/models/business.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';
import { CustomerFormDialogComponent } from '../dialogs/customer-form-dialog.component';

@Component({
  selector: 'app-staff-customers',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    CurrencyPipe,
  ],
  template: `
    <div class="header">
      <h1>B2B Customers</h1>
      <button mat-flat-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Add customer
      </button>
    </div>
    <table mat-table [dataSource]="customers()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let c">
          {{ c.name }}
          @if (!c.isActive) {
            <mat-chip color="warn">Inactive</mat-chip>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let c">{{ c.customerType }}</td>
      </ng-container>
      <ng-container matColumnDef="gstin">
        <th mat-header-cell *matHeaderCellDef>GSTIN</th>
        <td mat-cell *matCellDef="let c">{{ c.gstin || '—' }}</td>
      </ng-container>
      <ng-container matColumnDef="credit">
        <th mat-header-cell *matHeaderCellDef>Credit limit</th>
        <td mat-cell *matCellDef="let c">{{ c.creditLimit | currency: 'INR' }}</td>
      </ng-container>
      <ng-container matColumnDef="portal">
        <th mat-header-cell *matHeaderCellDef>Portal</th>
        <td mat-cell *matCellDef="let c">
          <mat-chip [color]="c.hasPortalAccess ? 'primary' : undefined">
            {{ c.hasPortalAccess ? 'Yes' : 'No' }}
          </mat-chip>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let c">
          <button mat-icon-button (click)="openEdit(c)" aria-label="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          @if (c.isActive) {
            <button mat-icon-button color="warn" (click)="remove(c)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          }
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
    }
    .full-width {
      width: 100%;
    }
  `,
})
export class StaffCustomersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly customers = signal<Customer[]>([]);
  readonly cols = ['name', 'type', 'gstin', 'credit', 'portal', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getCustomers().subscribe((c) => this.customers.set(c));
  }

  openCreate(): void {
    const ref = this.dialog.open(CustomerFormDialogComponent, { width: '560px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.createCustomer(result).subscribe({
        next: () => {
          this.snack.open('Customer created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snack.open('Failed to create customer', 'OK', { duration: 3000 }),
      });
    });
  }

  openEdit(customer: Customer): void {
    const ref = this.dialog.open(CustomerFormDialogComponent, {
      width: '560px',
      data: { customer },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.updateCustomer(customer.id, result).subscribe({
        next: () => {
          this.snack.open('Customer updated', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snack.open('Failed to update customer', 'OK', { duration: 3000 }),
      });
    });
  }

  remove(customer: Customer): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Deactivate customer',
        message: `Deactivate "${customer.name}"? They will no longer appear in active lists.`,
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.snack.open('Customer deactivated', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snack.open('Failed to deactivate customer', 'OK', { duration: 3000 }),
      });
    });
  }
}
