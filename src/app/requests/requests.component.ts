import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiService, IProxMoxUserRequest } from '../api.service';

@Component({
  selector: 'app-requests',
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
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzLayoutModule
  ],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestsComponent implements OnInit {
  public readonly requests = signal<IProxMoxUserRequest[]>([]);
  public readonly newRequest = signal<IRequestForm | null>(null);
  public readonly deleteRequestId = signal<number | null>(null);
  public readonly selectedRequestForm = this.fb.group({
    dateRange: [undefined, Validators.required],
    memory: [0, Validators.required],
    os: ['', Validators.required],
    processors: [0, Validators.required],
    storage: [0, Validators.required],
  });
  public constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService
  ) { }
  public async ngOnInit() {
    this.loadRequests();
  }
  public async save() {
    const request = this.selectedRequestForm.value;
    const response = await this.api.createRequest({
      startDate: request.dateRange![0],
      endDate: request.dateRange![1],
      memory: request.memory!,
      os: request.os!,
      processors: request.processors!,
      storage: request.storage!
    });

    console.log(response);

    this.newRequest.set(null);

    await this.loadRequests();
  }
  public getNewUserRequestObject(): IRequestForm {
    return {
      dateRange: [new Date(), new Date()],
      memory: 0,
      os: '',
      processors: 0,
      storage: 0,
    }
  }
  public async loadRequests() {
    const requests = await this.api.getRequests();

    this.requests.set(requests);
  }
  public async deleteRequest(id: number) {
    await this.api.deleteRequest(id);

    this.deleteRequestId.set(null);

    await this.loadRequests();
  }
}

interface IRequestForm {
  dateRange: [Date, Date];
  memory: number;
  os: string;
  processors: number;
  storage: number;
}
