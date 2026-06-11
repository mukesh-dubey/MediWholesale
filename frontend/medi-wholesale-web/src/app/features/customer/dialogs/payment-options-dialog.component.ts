import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { PaymentMethod } from '../../../core/models/business.model';

@Component({
  selector: 'app-payment-options-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Select Payment Method</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading payment methods...</p>
        </div>
      } @else {
        <div class="payment-methods">
          @for (method of methods(); track method.id) {
            <mat-card class="method-card" (click)="selectMethod(method)">
              <mat-card-content>
                <mat-icon class="method-icon">{{ getMethodIcon(method.id) }}</mat-icon>
                <h3>{{ method.name }}</h3>
                <p>{{ method.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </mat-dialog-content>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 16px;
    }

    .payment-methods {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .method-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        border-color: #1976d2;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      mat-card-content {
        text-align: center;
        padding: 20px;
      }
    }

    .method-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin: 0 auto 12px;
      color: #1976d2;
    }

    h3 {
      margin: 8px 0;
      font-size: 1rem;
    }

    p {
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      color: #666;
    }
  `,
})
export class PaymentOptionsDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(MatDialogRef<PaymentOptionsDialogComponent>);

  readonly methods = signal<PaymentMethod[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.getPaymentMethods().subscribe({
      next: (methods) => {
        this.methods.set(methods);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectMethod(method: PaymentMethod): void {
    this.dialogRef.close(method.id);
  }

  getMethodIcon(methodId: string): string {
    const icons: Record<string, string> = {
      cc: 'credit_card',
      dc: 'credit_card',
      nb: 'account_balance',
      upi: 'phone_android',
      wallet: 'account_balance_wallet',
    };
    return icons[methodId] || 'payment';
  }
}
