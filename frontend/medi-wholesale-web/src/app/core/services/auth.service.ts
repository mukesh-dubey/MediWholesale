import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest } from '../models/auth.model';

const STORAGE_KEY = 'medi_wholesale_auth';

/** Maps API JSON (camelCase or PascalCase) to AuthUser. */
function toAuthUser(raw: Record<string, unknown>): AuthUser | null {
  const token = (raw['token'] ?? raw['Token']) as string | undefined;
  if (!token) return null;

  const rolesRaw = raw['roles'] ?? raw['Roles'];
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : [];

  const customerIdRaw = raw['customerId'] ?? raw['CustomerId'];

  return {
    token,
    email: (raw['email'] ?? raw['Email'] ?? '') as string,
    fullName: (raw['fullName'] ?? raw['FullName'] ?? '') as string,
    roles,
    customerId: customerIdRaw != null ? Number(customerIdRaw) : null,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser | null>(this.loadFromStorage());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user()?.token);
  readonly isStaff = computed(() => {
    const roles = this._user()?.roles ?? [];
    return roles.includes('Admin') || roles.includes('Staff');
  });
  readonly isCustomer = computed(() => (this._user()?.roles ?? []).includes('Customer'));

  login(request: LoginRequest) {
    return this.http
      .post<Record<string, unknown>>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  /** Clear session when API returns 401 (expired or invalid token). */
  handleUnauthorized(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session-expired' },
    });
  }

  getToken(): string | null {
    return this._user()?.token ?? null;
  }

  private persist(res: Record<string, unknown>): void {
    const user = toAuthUser(res);
    if (!user) return;

    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    if (user.roles.includes('Customer')) {
      this.router.navigate(['/portal']);
    } else if (user.roles.includes('Admin') || user.roles.includes('Staff')) {
      this.router.navigate(['/staff']);
    }
  }

  private loadFromStorage(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return toAuthUser(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      return null;
    }
  }
}
