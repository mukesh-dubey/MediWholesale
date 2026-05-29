import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>local_pharmacy</mat-icon>
          <span>{{ title() }}</span>
        </div>
        <mat-nav-list>
          @for (item of navItems(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="spacer"></span>
          <span class="user">{{ auth.user()?.fullName }}</span>
          <button mat-button (click)="auth.logout()">Logout</button>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell {
      height: 100vh;
    }
    .sidenav {
      width: 240px;
      background: #fafafa;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 1rem;
      font-weight: 600;
      color: #0d47a1;
    }
    .content {
      padding: 1.5rem;
    }
    .spacer {
      flex: 1;
    }
    .user {
      margin-right: 1rem;
      font-size: 0.9rem;
    }
    a.active {
      background: #e3f2fd;
      color: #0d47a1;
    }
  `,
})
export class ShellLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly title = signal('MediWholesale');
  readonly navItems = signal<NavItem[]>([]);

  ngOnInit(): void {
    const data = this.findRouteData(this.route);
    this.title.set((data['title'] as string) ?? 'MediWholesale');
    this.navItems.set((data['nav'] as NavItem[]) ?? []);
  }

  /** Walk up the route tree to find layout data (works with lazy-loaded routes). */
  private findRouteData(route: ActivatedRoute): Record<string, unknown> {
    let current: ActivatedRoute | null = route;
    while (current) {
      if (current.snapshot.data['nav']) {
        return current.snapshot.data;
      }
      current = current.parent;
    }
    return route.snapshot.data;
  }
}
