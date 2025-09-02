import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiService } from '../api.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { IUser } from '../interfaces';
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
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    RouterOutlet,
    FormsModule,
    NzToolTipModule,
],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  public readonly users = signal<IUser[] | null>(null);
  public readonly selectedUser = signal<IUser | null>(null);
  public readonly roles = signal<string[] | null>(null);
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
    roleid: [''],
    enable: [false, Validators.required],
  });
  public searchValue: string | null = null;
  public tooltipText = "Key:value pairs, split by space. Keys: userid, firstname, lastname, roleid, comment. Applies logical \"and\""
  private _users = signal<IUser[] | null>(null);
  public constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly router: Router,
    private route: ActivatedRoute,
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
        roleid: user?.roleid,
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

    const roles = await this.api.getRoles();

    this.roles.set(roles);
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
      roleid: user.roleid!,
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
  public viewJobs(userid:string): undefined {
    this.router.navigate([userid, "jobs"], {relativeTo: this.route, replaceUrl: true},)
  }

  public search() {
    if (!this._users()) {
      this._users.set([...(this.users() || [])]);
    }
    const split = this.searchValue?.split(" ");
    const conditions = {} as any;
    split?.forEach((v) => {
      const pair = v.split(":");
      if (pair.length === 1) {
        this.users.set(this._users());
        return;
      }
      conditions[pair[0] as keyof IUser] = pair[1];
    })
    if (Object.keys(conditions).length === 0) return;
    this.users.set(
      this._users()?.filter((user) => {
        return Object.entries(conditions)
        .every(([key, value]) => user[key as keyof IUser]?.toString().includes(value as string)) } ) || null)
      }

  public clearSearch() {
    this.searchValue = "";
    this.users.set([...(this._users() || [])]);
  }
}
