import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Order, PaymentProcessing, PaymentResult } from '../../../core/models/business.model';

interface PaymentDialogData {
  order: Order;
  paymentMethod: string;
}

@Component({
  selector: 'app-payment-processing-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    CurrencyPipe,
  ],
  template: `
    @if (step() === 'processing') {
      <div class="processing-container">
        <h2 mat-dialog-title>Processing Payment</h2>
        <mat-dialog-content>
          <div class="processing-content">
            <div class="spinner"></div>
            <p><strong>Transaction ID:</strong> {{ transactionId() }}</p>
            <p><strong>Amount:</strong> {{ data.order.totalAmount | currency: 'INR' }}</p>
            <p><strong>Method:</strong> {{ data.paymentMethod }}</p>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p class="status-text">Processing your payment... Please wait.</p>
          </div>
        </mat-dialog-content>
      </div>
    } @else if (step() === 'success') {
      <div class="success-container">
        <h2 mat-dialog-title>Payment Successful</h2>
        <mat-dialog-content>
          <div class="success-content">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>Payment Completed Successfully!</h3>
            <div class="payment-details">
              <p><strong>Transaction ID:</strong> {{ transactionId() }}</p>
              <p><strong>Amount:</strong> {{ data.order.totalAmount | currency: 'INR' }}</p>
              <p><strong>Payment Method:</strong> {{ data.paymentMethod }}</p>
              <p><strong>Status:</strong> <span class="status-success">Success</span></p>
            </div>
            <p class="info-text">Your invoice has been generated and payment status updated. You will receive a confirmation email shortly.</p>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button color="primary" (click)="closeDialog()">Done</button>
        </mat-dialog-actions>
      </div>
    } @else if (step() === 'failed') {
      <div class="error-container">
        <h2 mat-dialog-title>Payment Failed</h2>
        <mat-dialog-content>
          <div class="error-content">
            <mat-icon class="error-icon">error</mat-icon>
            <h3>Payment Failed</h3>
            <div class="payment-details">
              <p><strong>Transaction ID:</strong> {{ transactionId() }}</p>
              <p><strong>Amount:</strong> {{ data.order.totalAmount | currency: 'INR' }}</p>
              <p><strong>Payment Method:</strong> {{ data.paymentMethod }}</p>
              <p><strong>Status:</strong> <span class="status-error">Failed</span></p>
            </div>
            @if (errorMessage()) {
              <div class="error-message">
                <p><strong>Reason:</strong> {{ errorMessage() }}</p>
              </div>
            }
            <p class="info-text">Please try again with a different payment method or contact support.</p>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button (click)="closeDialog()">Close</button>
          <button mat-button color="primary" (click)="retry()">Retry Payment</button>
        </mat-dialog-actions>
      </div>
    }
  `,
  styles: `
    .processing-container,
    .success-container,
    .error-container {
      width: 100%;
      max-width: 500px;
    }

    mat-dialog-content {
      padding: 20px 24px;
    }

    .processing-content,
    .success-content,
    .error-content {
      text-align: center;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 20px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .success-icon,
    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
    }

    .success-icon {
      color: #4caf50;
    }

    .error-icon {
      color: #f44336;
    }

    h3 {
      margin: 16px 0 8px 0;
      font-size: 1.2rem;
    }

    .payment-details {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
      text-align: left;
    }

    .payment-details p {
      margin: 8px 0;
      font-size: 0.95rem;
    }

    .status-success {
      color: #4caf50;
      font-weight: 600;
    }

    .status-error {
      color: #f44336;
      font-weight: 600;
    }

    .error-message {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      padding: 12px;
      margin: 16px 0;
      border-radius: 2px;
      text-align: left;
    }

    .error-message p {
      margin: 0;
      font-size: 0.9rem;
      color: #c62828;
    }

    .info-text {
      font-size: 0.9rem;
      color: #666;
      margin: 16px 0 0 0;
    }

    .status-text {
      margin-top: 16px;
      color: #666;
    }

    mat-progress-bar {
      margin: 16px 0;
    }

    mat-dialog-actions {
      padding: 12px 16px;
    }
  `,
})
export class PaymentProcessingDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(MatDialogRef<PaymentProcessingDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as PaymentDialogData;

  readonly step = signal<'processing' | 'success' | 'failed'>('processing');
  readonly transactionId = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.processPayment();
  }

  private processPayment(): void {
    // Step 1: Initiate payment
    this.api.initiatePayment(this.data.order.id, this.data.paymentMethod).subscribe({
      next: (processing) => {
        this.transactionId.set(processing.transactionId);

        // Step 2: Wait 2-3 seconds to simulate gateway processing
        setTimeout(() => {
          this.confirmPayment(processing);
        }, 2000 + Math.random() * 1000);
      },
      error: () => {
        this.step.set('failed');
        this.errorMessage.set('Failed to initiate payment. Please try again.');
      },
    });
  }

  private confirmPayment(processing: PaymentProcessing): void {
    this.api.confirmPayment(processing).subscribe({
      next: (result) => {
        if (result.status === 'Success') {
          this.step.set('success');
        } else {
          this.step.set('failed');
          this.errorMessage.set(result.errorMessage || 'Payment was declined.');
        }
      },
      error: () => {
        this.step.set('failed');
        this.errorMessage.set('Error processing payment. Please try again.');
      },
    });
  }

  retry(): void {
    this.step.set('processing');
    this.transactionId.set('');
    this.errorMessage.set('');
    this.processPayment();
  }

  closeDialog(): void {
    this.dialogRef.close(this.step() === 'success');
  }
}
