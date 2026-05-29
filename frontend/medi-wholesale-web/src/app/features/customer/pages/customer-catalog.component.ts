import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/business.model';

@Component({
  selector: 'app-customer-catalog',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatSnackBarModule],
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
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let p">
          <button mat-button color="primary" (click)="order(p)" [disabled]="p.totalStock < 1">
            Order 10 units
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
  styles: `.full-width { width: 100%; }`,
})
export class CustomerCatalogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  readonly products = signal<Product[]>([]);
  readonly cols = ['name', 'sku', 'hsn', 'gst', 'stock', 'actions'];

  ngOnInit(): void {
    this.api.getProducts().subscribe((p) => this.products.set(p));
  }

  order(product: Product): void {
    const customerId = this.auth.user()?.customerId;
    if (!customerId) return;

    this.api
      .createOrder({
        customerId,
        notes: `Portal order for ${product.name}`,
        lines: [{ productId: product.id, quantity: 10, unitPrice: 50 }],
      })
      .subscribe({
        next: (o) =>
          this.snack.open(`Order ${o.orderNumber} placed — pending staff confirmation`, 'OK', {
            duration: 4000,
          }),
        error: () => this.snack.open('Could not place order', 'OK', { duration: 3000 }),
      });
  }
}
