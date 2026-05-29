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
import { MatSelectModule } from '@angular/material/select';
import { CUSTOMER_TYPES } from '../../../core/services/api.service';
import { Customer, CustomerType } from '../../../core/models/business.model';

export interface CustomerFormDialogData {
  customer?: Customer;
}

@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit customer' : 'Add customer' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="customerType">
            @for (t of customerTypes; track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Postal code</mat-label>
          <input matInput formControlName="postalCode" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>GSTIN</mat-label>
          <input matInput formControlName="gstin" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Drug license</mat-label>
          <input matInput formControlName="drugLicenseNumber" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Credit limit</mat-label>
          <input matInput type="number" formControlName="creditLimit" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Payment terms (days)</mat-label>
          <input matInput type="number" formControlName="paymentTermDays" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Opening balance</mat-label>
          <input matInput type="number" formControlName="openingBalance" />
        </mat-form-field>
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
    .span-2 {
      grid-column: span 2;
    }
  `,
})
export class CustomerFormDialogComponent implements OnInit {
  readonly data: CustomerFormDialogData =
    inject<CustomerFormDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private readonly ref = inject(MatDialogRef<CustomerFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly customerTypes = CUSTOMER_TYPES;
  readonly isEdit = !!this.data.customer;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    customerType: ['Hospital' as CustomerType, Validators.required],
    phone: ['', Validators.required],
    email: [''],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    gstin: [''],
    drugLicenseNumber: ['', Validators.required],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    paymentTermDays: [30, [Validators.required, Validators.min(0)]],
    openingBalance: [0],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data.customer) {
      const c = this.data.customer;
      this.form.patchValue({
        name: c.name,
        customerType: c.customerType,
        phone: c.phone,
        email: c.email ?? '',
        address: c.address,
        city: c.city,
        state: c.state,
        postalCode: c.postalCode,
        gstin: c.gstin ?? '',
        drugLicenseNumber: c.drugLicenseNumber,
        creditLimit: c.creditLimit,
        paymentTermDays: c.paymentTermDays,
        openingBalance: c.openingBalance,
        isActive: c.isActive,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      ...v,
      email: v.email || null,
      gstin: v.gstin || null,
    });
  }
}
