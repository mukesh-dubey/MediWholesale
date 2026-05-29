import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>MediWholesale</mat-card-title>
          <mat-card-subtitle>India · Wholesale Medicine Supply</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            @if (sessionExpired()) {
              <p class="warn">Session expired. Please sign in again.</p>
            }
            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
            <button mat-flat-button color="primary" class="full-width" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Sign in
              }
            </button>
          </form>
          <div class="demo-hints">
            <p><strong>Staff:</strong> staff@mediwholesale.in / Staff&#64;123</p>
            <p><strong>Customer portal:</strong> customer@cityhospital.in / Customer&#64;123</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #e3f2fd 100%);
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    .error {
      color: #c62828;
      font-size: 0.875rem;
    }
    .warn {
      color: #e65100;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .demo-hints {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #546e7a;
      p {
        margin: 0.25rem 0;
      }
    }
  `,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sessionExpired = signal(false);

  ngOnInit(): void {
    this.sessionExpired.set(this.route.snapshot.queryParamMap.get('reason') === 'session-expired');
    // Drop stale tokens so a fresh login always gets a new JWT.
    if (this.sessionExpired()) {
      localStorage.removeItem('medi_wholesale_auth');
    }
  }

  readonly form = this.fb.nonNullable.group({
    email: ['staff@mediwholesale.in', [Validators.required, Validators.email]],
    password: ['Staff@123', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid email or password.');
      },
    });
  }
}
