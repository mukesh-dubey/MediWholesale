import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Product } from '../../../core/models/business.model';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit product' : 'Add product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Generic name</mat-label>
          <input matInput formControlName="genericName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Brand</mat-label>
          <input matInput formControlName="brand" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <input matInput formControlName="category" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Unit</mat-label>
          <input matInput formControlName="unit" placeholder="Strip, Bottle..." />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>HSN code</mat-label>
          <input matInput formControlName="hsnCode" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>GST %</mat-label>
          <input matInput type="number" formControlName="gstRatePercent" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Reorder level</mat-label>
          <input matInput type="number" formControlName="reorderLevel" />
        </mat-form-field>
        <mat-checkbox formControlName="isPrescriptionRequired">Rx required</mat-checkbox>
        @if (isEdit) {
          <mat-checkbox formControlName="isActive">Active</mat-checkbox>
        }
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
  `,
})
export class ProductFormDialogComponent implements OnInit {
  readonly data: ProductFormDialogData =
    inject<ProductFormDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private readonly ref = inject(MatDialogRef<ProductFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = !!this.data.product;

  readonly form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    genericName: ['', Validators.required],
    brand: [''],
    category: ['', Validators.required],
    unit: ['', Validators.required],
    hsnCode: ['', Validators.required],
    gstRatePercent: [12, [Validators.required, Validators.min(0)]],
    isPrescriptionRequired: [false],
    reorderLevel: [10, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data.product) {
      const p = this.data.product;
      this.form.patchValue({
        sku: p.sku,
        name: p.name,
        genericName: p.genericName,
        brand: p.brand ?? '',
        category: p.category,
        unit: p.unit,
        hsnCode: p.hsnCode,
        gstRatePercent: p.gstRatePercent,
        isPrescriptionRequired: p.isPrescriptionRequired,
        reorderLevel: p.reorderLevel,
        isActive: p.isActive,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({ ...v, brand: v.brand || null });
  }
}
