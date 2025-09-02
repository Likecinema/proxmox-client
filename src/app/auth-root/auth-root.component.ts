import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-auth-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NzIconModule],
  templateUrl: './auth-root.component.html',
  styleUrl: './auth-root.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthRootComponent implements OnDestroy {
  public readonly navItems: Array<{
    label: string;
    icon: string;
    link: string;
    requiresAdmin: boolean;
  }> = [
      {
        label: 'Dashboard',
        icon: 'bar-chart',
        link: '/app/dashboard',
        requiresAdmin: true
      },
      {
        label: 'Users',
        icon: 'team',
        link: '/app/users',
        requiresAdmin: true
      },
      {
        label: 'Requests',
        icon: 'inbox',
        link: '/app/requests',
        requiresAdmin: false
      },
      {
        label: 'Jobs',
        icon: 'cloud-server',
        link: '/app/jobs',
        requiresAdmin: false,
      },
      {
        label: 'Schedule',
        icon: 'calendar',
        link: '/app/schedule',
        requiresAdmin: true,
      }
    ];
  private readonly subscriptions: Subscription[] = [];
  public constructor(
    public readonly api: ApiService,
    private readonly router: Router,
    route: ActivatedRoute
  ) {
    this.subscriptions.push(
      route.url.subscribe(() => {
        if (this.router.url === '/app') {
          const isAdmin = this.api.isAdmin();

          if (isAdmin) {
            this.router.navigate(['/app/dashboard']);
          } else {
            this.router.navigate(['/app/requests']);
          }
        }
      })
    );
  }
  public ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
  public logout() {
    this.api.logout();
    this.router.navigate(['']);
  }
}
