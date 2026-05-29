import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { BatchStock, Product } from '../../../core/models/business.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';
import { BatchFormDialogComponent } from '../dialogs/batch-form-dialog.component';

@Component({
  selector: 'app-staff-inventory',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    DatePipe,
    CurrencyPipe,
  ],
  template: `
    <div class="header">
      <h1>Batch Inventory</h1>
      <button mat-flat-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Add batch
      </button>
    </div>
    <table mat-table [dataSource]="batches()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="product">
        <th mat-header-cell *matHeaderCellDef>Product</th>
        <td mat-cell *matCellDef="let b">{{ b.productName }}</td>
      </ng-container>
      <ng-container matColumnDef="batch">
        <th mat-header-cell *matHeaderCellDef>Batch</th>
        <td mat-cell *matCellDef="let b">{{ b.batchNumber }}</td>
      </ng-container>
      <ng-container matColumnDef="expiry">
        <th mat-header-cell *matHeaderCellDef>Expiry</th>
        <td mat-cell *matCellDef="let b">{{ b.expiryDate | date: 'mediumDate' }}</td>
      </ng-container>
      <ng-container matColumnDef="qty">
        <th mat-header-cell *matHeaderCellDef>Qty</th>
        <td mat-cell *matCellDef="let b">{{ b.quantity }}</td>
      </ng-container>
      <ng-container matColumnDef="sale">
        <th mat-header-cell *matHeaderCellDef>Sale rate</th>
        <td mat-cell *matCellDef="let b">{{ b.saleRate | currency: 'INR' }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let b">
          @if (b.isExpired) {
            <mat-chip color="warn">Expired</mat-chip>
          } @else if (b.isLowStock) {
            <mat-chip>Low stock</mat-chip>
          } @else {
            <mat-chip color="primary">OK</mat-chip>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let b">
          <button mat-icon-button (click)="openEdit(b)" aria-label="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="remove(b)" aria-label="Delete">
            <mat-icon>delete</mat-icon>
          </button>
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
export class StaffInventoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly batches = signal<BatchStock[]>([]);
  readonly products = signal<Product[]>([]);
  readonly cols = ['product', 'batch', 'expiry', 'qty', 'sale', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
    this.api.getProducts().subscribe((p) => this.products.set(p));
  }

  load(): void {
    this.api.getBatches().subscribe((b) => this.batches.set(b));
  }

  openCreate(): void {
    const products = this.products();
    if (products.length === 0) {
      this.snack.open('Add a product first', 'OK', { duration: 3000 });
      return;
    }
    const ref = this.dialog.open(BatchFormDialogComponent, {
      width: '560px',
      data: { products },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.createBatch(result).subscribe({
        next: () => {
          this.snack.open('Batch added', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to add batch', 'OK', { duration: 4000 }),
      });
    });
  }

  openEdit(batch: BatchStock): void {
    const ref = this.dialog.open(BatchFormDialogComponent, {
      width: '560px',
      data: { batch, products: this.products() },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const { productId: _, ...body } = result;
      this.api.updateBatch(batch.id, body).subscribe({
        next: () => {
          this.snack.open('Batch updated', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to update batch', 'OK', { duration: 4000 }),
      });
    });
  }

  remove(batch: BatchStock): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete batch',
        message: `Delete batch "${batch.batchNumber}" for ${batch.productName}?`,
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.deleteBatch(batch.id).subscribe({
        next: () => {
          this.snack.open('Batch deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to delete batch', 'OK', { duration: 4000 }),
      });
    });
  }
}
