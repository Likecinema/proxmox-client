import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
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
    NzSwitchModule,
    NzIconModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  public readonly users = signal<IUser[] | null>(null);
  public readonly selectedUser = signal<IUser | null>(null);
  public readonly mode = computed(() => {
    const user = this.selectedUser();

    return user?.userid ? 'Edit' : 'Create';
  });
  public readonly selectedUserForm = this.fb.group({
    userid: ['', Validators.required],
    password: ['', Validators.required],
    email: [''],
    firstname: [''],
    lastname: [''],
    comment: [''],
    enable: [false, Validators.required],
  });
  public constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService
  ) {
    effect(() => {
      const user = this.selectedUser();

      this.selectedUserForm.patchValue({
        userid: user?.userid,
        password: '',
        email: user?.email,
        firstname: user?.firstname,
        lastname: user?.lastname,
        comment: user?.comment,
        enable: user?.enable === 1,
      });

      if (user?.userid) {
        this.selectedUserForm.get('password')?.disable();
        this.selectedUserForm.get('userid')?.disable();
        this.selectedUserForm.get('email')?.disable();
      } else {
        this.selectedUserForm.get('password')?.enable();
        this.selectedUserForm.get('userid')?.enable();
        this.selectedUserForm.get('email')?.enable();
      }
    });
  }
  public async ngOnInit() {
    const users = await this.api.getUsers();

    this.users.set(users);
  }
  public selectUser(user: IUser) {
    this.selectedUser.set(user);
  }
  public async deleteUser(userid: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await this.api.deleteUser(userid);

      const users = await this.api.getUsers();

      this.users.set(users);
    }
  }
  public async saveSelectedUser() {
    const user = this.selectedUserForm.value;

    await this.api.createUser({
      userid: user.userid! || this.selectedUser()?.userid!,
      password: user.password!,
      email: user.email!,
      firstname: user.firstname!,
      lastname: user.lastname!,
      comment: user.comment!,
      enable: user.enable ? 1 : 0
    });

    const users = await this.api.getUsers();

    this.users.set(users);
    this.selectedUser.set(null);
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
