import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Invoice } from '../../../core/models/business.model';

@Component({
  selector: 'app-invoice-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <h2 mat-dialog-title>Invoice Details</h2>
    <mat-dialog-content class="invoice-dialog">
      <!-- Invoice Header -->
      <section class="invoice-header">
        <div class="header-info">
          <h3>Invoice #{{ invoice.invoiceNumber }}</h3>
          <p><strong>Date:</strong> {{ invoice.invoiceDate | date: 'long' }}</p>
          <p>
            <strong>Status:</strong>
            <mat-chip [color]="invoice.status === 'Confirmed' ? 'accent' : 'primary'">
              {{ invoice.status }}
            </mat-chip>
          </p>
          <p>
            <strong>Payment Status:</strong>
            <mat-chip [color]="invoice.paymentStatus === 'Paid' ? 'accent' : 'warn'">
              {{ invoice.paymentStatus }}
            </mat-chip>
          </p>
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- Customer Details -->
      <section class="customer-details">
        <h4>Customer Details</h4>
        <div class="details-grid">
          <div>
            <p><strong>Name:</strong> {{ invoice.customerName }}</p>
            <p><strong>Phone:</strong> {{ invoice.phone }}</p>
            <p><strong>Email:</strong> {{ invoice.email }}</p>
          </div>
          <div>
            <p><strong>Address:</strong> {{ invoice.address }}</p>
            <p><strong>City:</strong> {{ invoice.city }}, {{ invoice.state }} {{ invoice.postalCode }}</p>
            <p><strong>GSTIN:</strong> {{ invoice.gstin || 'N/A' }}</p>
          </div>
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- Order Items -->
      <section class="order-items">
        <h4>Order Items</h4>
        <table mat-table [dataSource]="invoice.lines" class="items-table full-width">
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let line">
              <div>
                <strong>{{ line.productName }}</strong>
                <small>HSN: {{ line.hsnCode }}</small>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="batch">
            <th mat-header-cell *matHeaderCellDef>Batch</th>
            <td mat-cell *matCellDef="let line">
              <div>
                <small>{{ line.batchNumber || 'N/A' }}</small>
                @if (line.expiryDate) {
                  <br />
                  <small>Expiry: {{ line.expiryDate | date: 'MMM yyyy' }}</small>
                }
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="qty">
            <th mat-header-cell *matHeaderCellDef>Quantity</th>
            <td mat-cell *matCellDef="let line">{{ line.quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Unit Price</th>
            <td mat-cell *matCellDef="let line">{{ line.unitPrice | currency: 'INR' }}</td>
          </ng-container>
          <ng-container matColumnDef="gst">
            <th mat-header-cell *matHeaderCellDef>GST %</th>
            <td mat-cell *matCellDef="let line">{{ line.gstRatePercent }}%</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Line Total</th>
            <td mat-cell *matCellDef="let line">{{ line.lineTotal | currency: 'INR' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="lineCols"></tr>
          <tr mat-row *matRowDef="let row; columns: lineCols"></tr>
        </table>
      </section>

      <mat-divider></mat-divider>

      <!-- Taxes and Discounts -->
      <section class="taxes-section">
        <h4>Taxes & Discounts</h4>
        <div class="tax-details">
          <div class="tax-row">
            <span>Subtotal:</span>
            <strong>{{ invoice.subTotal | currency: 'INR' }}</strong>
          </div>
          @if (invoice.discountAmount > 0) {
            <div class="tax-row discount">
              <span>Discount:</span>
              <strong>-{{ invoice.discountAmount | currency: 'INR' }}</strong>
            </div>
          }
          @if (invoice.cgstAmount > 0) {
            <div class="tax-row">
              <span>CGST (Central GST):</span>
              <strong>{{ invoice.cgstAmount | currency: 'INR' }}</strong>
            </div>
          }
          @if (invoice.sgstAmount > 0) {
            <div class="tax-row">
              <span>SGST (State GST):</span>
              <strong>{{ invoice.sgstAmount | currency: 'INR' }}</strong>
            </div>
          }
          @if (invoice.igstAmount > 0) {
            <div class="tax-row">
              <span>IGST (Integrated GST):</span>
              <strong>{{ invoice.igstAmount | currency: 'INR' }}</strong>
            </div>
          }
          <div class="tax-row total">
            <span>Final Total:</span>
            <strong>{{ invoice.totalAmount | currency: 'INR' }}</strong>
          </div>
          @if (invoice.amountPaid > 0) {
            <div class="tax-row">
              <span>Amount Paid:</span>
              <strong>{{ invoice.amountPaid | currency: 'INR' }}</strong>
            </div>
          }
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- Additional Info -->
      <section class="additional-info">
        <div class="info-row">
          <span><strong>Supply Type:</strong> {{ invoice.supplyType }}</span>
          <span><strong>Place of Supply:</strong> {{ invoice.placeOfSupply || 'N/A' }}</span>
        </div>
      </section>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-button color="primary">
        <mat-icon>download</mat-icon>
        Download PDF
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .invoice-dialog {
      max-width: 100%;
      padding: 0;
      margin: -16px -24px;
    }

    section {
      padding: 16px 24px;
    }

    h4 {
      margin: 0 0 16px 0;
      font-size: 1rem;
    }

    .header-info h3 {
      margin: 0 0 8px 0;
    }

    .header-info p {
      margin: 4px 0;
      font-size: 0.9rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .details-grid p {
      margin: 8px 0;
      font-size: 0.95rem;
    }

    .details-grid small {
      color: #666;
    }

    .items-table {
      width: 100%;
      font-size: 0.9rem;

      th {
        background-color: #f5f5f5;
        font-weight: 600;
      }

      td {
        padding: 8px;
      }
    }

    .tax-details {
      background-color: #f9f9f9;
      padding: 12px;
      border-radius: 4px;
    }

    .tax-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.95rem;
    }

    .tax-row.discount {
      color: #d32f2f;
    }

    .tax-row.total {
      font-size: 1.1rem;
      font-weight: 600;
      border-top: 2px solid #ddd;
      border-bottom: 2px solid #ddd;
      padding: 8px 0;
      margin: 8px 0;
    }

    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      font-size: 0.95rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      width: 100%;
    }

    mat-chip {
      font-size: 0.85rem;
      height: 24px;
    }
  `,
})
export class InvoiceDetailsDialogComponent {
  readonly invoice = inject(MAT_DIALOG_DATA) as Invoice;
  readonly lineCols = ['product', 'batch', 'qty', 'price', 'gst', 'total'];
}
