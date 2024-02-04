import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiService, IUser } from '../api.service';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzDrawerModule,
    NzFormModule,
    ReactiveFormsModule,
    NzSwitchModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  public readonly users = signal<IUser[] | null>(null);
  public readonly selectedUser = signal<IUser | null>(null);
  public readonly selectedUserForm = this.fb.group({
    userid: ['', Validators.required],
    password: ['', Validators.required],
    email: [''],
    firstname: [''],
    lastname: [''],
    comment: [''],
    enable: ['', Validators.required],
  });
  public constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService
  ) { }
  public async ngOnInit() {
    const users = await this.api.getUsers();

    this.users.set(users);
  }
  public selectUser(user: IUser) {
    this.selectedUser.set(user);
  }
  public async saveSelectedUser() {

  }
  public getNewUserObject(): IUser {
    return {
      userid: '',
      email: '',
      firstname: '',
      lastname: '',
      enable: 0,
      expire: 0,
      comment: '',
      ["realm-type"]: '',
    }
  }
}
