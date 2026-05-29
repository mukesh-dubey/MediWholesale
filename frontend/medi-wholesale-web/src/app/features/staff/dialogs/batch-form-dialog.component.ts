import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BatchStock, Product } from '../../../core/models/business.model';

export interface BatchFormDialogData {
  batch?: BatchStock;
  products: Product[];
}

@Component({
  selector: 'app-batch-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit batch' : 'Add batch' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        @if (!isEdit) {
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Product</mat-label>
            <mat-select formControlName="productId">
              @for (p of data.products; track p.id) {
                <mat-option [value]="p.id">{{ p.name }} ({{ p.sku }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Batch number</mat-label>
          <input matInput formControlName="batchNumber" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Expiry date</mat-label>
          <input matInput type="date" formControlName="expiryDate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Quantity</mat-label>
          <input matInput type="number" formControlName="quantity" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Purchase rate</mat-label>
          <input matInput type="number" formControlName="purchaseRate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Sale rate</mat-label>
          <input matInput type="number" formControlName="saleRate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>MRP</mat-label>
          <input matInput type="number" formControlName="mrp" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Manufacturer</mat-label>
          <input matInput formControlName="manufacturer" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rack location</mat-label>
          <input matInput formControlName="rackLocation" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
      min-width: 480px;
    }
    .span-2 {
      grid-column: span 2;
    }
  `,
})
export class BatchFormDialogComponent implements OnInit {
  readonly data: BatchFormDialogData =
    inject<BatchFormDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? { products: [] };
  private readonly ref = inject(MatDialogRef<BatchFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = !!this.data.batch;

  readonly form = this.fb.nonNullable.group({
    productId: [0, Validators.required],
    batchNumber: ['', Validators.required],
    expiryDate: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    purchaseRate: [0, [Validators.required, Validators.min(0)]],
    saleRate: [0, [Validators.required, Validators.min(0)]],
    mrp: [0, [Validators.required, Validators.min(0)]],
    manufacturer: [''],
    rackLocation: [''],
  });

  ngOnInit(): void {
    if (this.data.batch) {
      const b = this.data.batch;
      const expiry = b.expiryDate.includes('T')
        ? b.expiryDate.split('T')[0]
        : b.expiryDate.substring(0, 10);
      this.form.patchValue({
        productId: b.productId,
        batchNumber: b.batchNumber,
        expiryDate: expiry,
        quantity: b.quantity,
        purchaseRate: b.purchaseRate,
        saleRate: b.saleRate,
        mrp: b.mrp,
        manufacturer: b.manufacturer ?? '',
        rackLocation: b.rackLocation ?? '',
      });
    } else if (this.data.products.length > 0) {
      this.form.patchValue({ productId: this.data.products[0].id });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      ...v,
      expiryDate: new Date(v.expiryDate).toISOString(),
      manufacturer: v.manufacturer || null,
      rackLocation: v.rackLocation || null,
    });
  }
}
