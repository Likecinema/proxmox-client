import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiService, IUser } from '../api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  public readonly users = signal<IUser[] | null>(null);
  public constructor(private readonly api: ApiService) { }
  public async ngOnInit() {
    const users = await this.api.getUsers();

    this.users.set(users);
  }
}
