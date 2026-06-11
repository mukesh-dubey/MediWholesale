import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/business.model';

@Component({
  selector: 'app-customer-catalog',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, CurrencyPipe],
  template: `
    <h1>Product catalog</h1>
    <table mat-table [dataSource]="products()" class="mat-elevation-z1 full-width">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Product</th>
        <td mat-cell *matCellDef="let p">{{ p.name }}</td>
      </ng-container>
      <ng-container matColumnDef="sku">
        <th mat-header-cell *matHeaderCellDef>SKU</th>
        <td mat-cell *matCellDef="let p">{{ p.sku }}</td>
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
      <ng-container matColumnDef="saleRate">
        <th mat-header-cell *matHeaderCellDef>Sale rate</th>
        <td mat-cell *matCellDef="let p">{{ p.saleRate | currency: 'INR' }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let p">
          <div class="order-action">
            <mat-form-field appearance="outline" class="quantity-field">
              <mat-label>Qty</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [max]="p.totalStock"
                [disabled]="p.totalStock < 1"
                #quantity
                value="1"
              />
            </mat-form-field>
            <button
              mat-button
              color="primary"
              (click)="order(p, quantity.value)"
              [disabled]="p.totalStock < 1 || p.saleRate <= 0"
            >
              Order
            </button>
          </div>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `
    .full-width {
      width: 100%;
    }

    .order-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-block: 8px;
    }

    .quantity-field {
      width: 96px;
    }
  `,
})
export class CustomerCatalogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  readonly products = signal<Product[]>([]);
  readonly cols = ['name', 'sku', 'hsn', 'gst', 'stock', 'saleRate', 'actions'];

  ngOnInit(): void {
    this.api.getProducts().subscribe((p) => this.products.set(p));
  }

  order(product: Product, requestedQuantity: string): void {
    const customerId = this.auth.user()?.customerId;
    if (!customerId) return;

    const quantity = Math.floor(Number(requestedQuantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      this.snack.open('Enter a valid quantity', 'OK', { duration: 3000 });
      return;
    }

    if (quantity > product.totalStock) {
      this.snack.open(`Only ${product.totalStock} units are available`, 'OK', { duration: 3000 });
      return;
    }

    if (product.saleRate <= 0) {
      this.snack.open('Sale rate is not available for this product', 'OK', { duration: 3000 });
      return;
    }

    this.api
      .createOrder({
        customerId,
        notes: `Portal order for ${product.name}`,
        lines: [{ productId: product.id, quantity, unitPrice: product.saleRate }],
      })
      .subscribe({
        next: (o) =>
          this.snack.open(`Order ${o.orderNumber} placed - pending staff confirmation`, 'OK', {
            duration: 4000,
          }),
        error: () => this.snack.open('Could not place order', 'OK', { duration: 3000 }),
      });
  }
}
