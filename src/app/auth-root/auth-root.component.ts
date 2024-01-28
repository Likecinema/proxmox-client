import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-root.component.html',
  styleUrl: './auth-root.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthRootComponent {

}
