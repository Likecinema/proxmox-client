import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { ApiService } from '../api.service';
import { IProxMoxUserRequest } from '../interfaces';

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
    NzLayoutModule,
    NzToolTipModule,
    NzTimePickerModule,
  ],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestsComponent implements OnInit {
  private defaultRequests: IProxMoxUserRequest[] = [];
  public readonly requests = signal<IProxMoxUserRequest[]>([]);
  public readonly undeletedRequests = computed(() => this.requests().filter(r => !r.toBeRemoved));
  public readonly newRequest = signal<IRequestForm | null>(null);
  public readonly deleteRequestId = signal<number | null>(null);
  public readonly disabledDates = (date: Date) => date < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1)
  public readonly selectedRequestForm = this.fb.group({
    dateRange: this.fb.control<undefined | Date[]>(undefined, [Validators.required]),
    memory: [0, Validators.required],
    os: ['', Validators.required],
    processors: [0, Validators.required],
    storage: [0, Validators.required],
    repeat:this.fb.control<number[]>([], [Validators.nullValidator]),
    timeFrom: [new Date(), Validators.required],
    timeTo: [new Date(), Validators.required],
  });
  public readonly daysList = [
    {value: 0, text: "Sunday"},
    {value: 1, text: "Monday"},
    {value: 2, text: "Tuesday"},
    {value: 3, text: "Wednesday"},
    {value: 4, text: "Thursday"},
    {value: 5, text: "Friday"},
    {value: 6, text: "Saturday"},
  ]
  public constructor(
    public readonly api: ApiService,
    private readonly fb: FormBuilder,
  ) { }
  public async ngOnInit() {
    this.loadRequests();
  }
  public async save() {
    let start = 0;
    let end = (60*60*24) - 1 //seconds
    const request = this.selectedRequestForm.value;
    if (!request?.repeat?.length) {
      const secondsStart = request.timeFrom?.getSeconds() || 0
      const minutesStart = request.timeFrom?.getMinutes() || 0;
      const hoursStart = request.timeFrom?.getHours() || 0;
      const secondsEnd = request.timeTo?.getSeconds() || 0;
      const minutesEnd = request.timeTo?.getMinutes() || 0;
      const hoursEnd = request.timeTo?.getHours() || 0;
      start = secondsStart + (minutesStart * 60) + (hoursStart * 60 * 60);
      end = secondsEnd + (minutesEnd * 60 ) + (hoursEnd * 60 * 60);
      console.log("here");
    }
    const startDate = new Date(request.dateRange![0]);
    startDate.setHours(0, 0, start, 0);
    const endDate = new Date(request.dateRange![1]);
    endDate.setHours(0, 0, end, 0);
    this.selectedRequestForm.get("dateRange")?.setValue([startDate, endDate])
    await this.api.createRequest({
      startDate: new Date(this.selectedRequestForm.value.dateRange![0]).toISOString(),
      endDate: this.selectedRequestForm.value.dateRange![1].toISOString(),
      repeat: request.repeat!,
      timeFrom: start!,
      timeTo: end!,
      memory: request.memory!,
      os: request.os! || '',
      processors: request.processors!,
      storage: request.storage!
    });


    this.resetForm();

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
    this.defaultRequests = requests
    this.requests.set(requests);
  }
  public async deleteRequest(id: number) {
    await this.api.deleteRequest(id);

    this.deleteRequestId.set(null);

    await this.loadRequests();
  }
  public resetForm() {
    console.log(this.selectedRequestForm);
    this.selectedRequestForm.reset();
    this.newRequest.set(null);
  }

  public sortBy(event: any, key: string) {
    let requests = this.requests().slice()
    if (event === "ascend") {
      requests.sort((a: any, b: any) => {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
        console.log("what")
        return 0;
      });
    }
    else if (event === "descend") {
      requests.sort((a: any, b: any) => {
        if (!b[key] || !a[key]) return 0;
        if (a[key] < b[key]) return 1;
        if (a[key] > b[key]) return -1;
        return 0;
      });
    }
    else {
      requests = this.defaultRequests;
    }
    this.requests.set(requests);
  }
}

interface IRequestForm {
  dateRange: [Date, Date];
  memory: number;
  os: string;
  processors: number;
  storage: number;
}
