import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzResultModule } from 'ng-zorro-antd/result';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    ReactiveFormsModule,
    RouterModule,
    NzResultModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
  public readonly loginForm = this.fb.group({
    userid: ['', Validators.required],
    password: ['', Validators.required],
    email: ['', Validators.required],
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    comment: ['', Validators.required],
  });
  public loading = false;
  public readonly isSubmitted = signal(false);

  public constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly router: Router
  ) { }

  public async submitForm() {
    if (this.loginForm.valid) {
      const options = this.loginForm.value as Required<NotNull<typeof this.loginForm.value>>;

      await this.api.signup(options);

      this.isSubmitted.set(true);
    }
  }
}

type NotNull<T> = {
  [P in keyof T]: Exclude<T[P], null>;
};
