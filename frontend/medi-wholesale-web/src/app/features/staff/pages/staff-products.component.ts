import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models/business.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';
import { ProductFormDialogComponent } from '../dialogs/product-form-dialog.component';

@Component({
  selector: 'app-staff-products',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="header">
      <h1>Products</h1>
      <button mat-flat-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Add product
      </button>
    </div>
    <table mat-table [dataSource]="products()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="sku">
        <th mat-header-cell *matHeaderCellDef>SKU</th>
        <td mat-cell *matCellDef="let p">{{ p.sku }}</td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let p">
          {{ p.name }}
          @if (!p.isActive) {
            <mat-chip color="warn">Inactive</mat-chip>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="hsn">
        <th mat-header-cell *matHeaderCellDef>HSN</th>
        <td mat-cell *matCellDef="let p">{{ p.hsnCode }}</td>
      </ng-container>
      <ng-container matColumnDef="gst">
        <th mat-header-cell *matHeaderCellDef>GST %</th>
        <td mat-cell *matCellDef="let p">{{ p.gstRatePercent }}%</td>
      </ng-container>
      <ng-container matColumnDef="stock">
        <th mat-header-cell *matHeaderCellDef>Stock</th>
        <td mat-cell *matCellDef="let p">{{ p.totalStock }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let p">
          <button mat-icon-button (click)="openEdit(p)" aria-label="Edit">
            <mat-icon>edit</mat-icon>
          </button>
          @if (p.isActive) {
            <button mat-icon-button color="warn" (click)="remove(p)" aria-label="Delete">
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
export class StaffProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly products = signal<Product[]>([]);
  readonly cols = ['sku', 'name', 'hsn', 'gst', 'stock', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getProducts(undefined, true).subscribe((p) => this.products.set(p));
  }

  openCreate(): void {
    const ref = this.dialog.open(ProductFormDialogComponent, { width: '560px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.createProduct(result).subscribe({
        next: () => {
          this.snack.open('Product created', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to create product', 'OK', { duration: 4000 }),
      });
    });
  }

  openEdit(product: Product): void {
    const ref = this.dialog.open(ProductFormDialogComponent, {
      width: '560px',
      data: { product },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.updateProduct(product.id, result).subscribe({
        next: () => {
          this.snack.open('Product updated', 'OK', { duration: 3000 });
          this.load();
        },
        error: (e) =>
          this.snack.open(e.error?.message ?? 'Failed to update product', 'OK', { duration: 4000 }),
      });
    });
  }

  remove(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Deactivate product',
        message: `Deactivate "${product.name}"? Existing batches will remain.`,
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.deleteProduct(product.id).subscribe({
        next: () => {
          this.snack.open('Product deactivated', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snack.open('Failed to deactivate product', 'OK', { duration: 3000 }),
      });
    });
  }
}
