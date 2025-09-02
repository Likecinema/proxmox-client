import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { NzUploadFile, NzUploadModule} from "ng-zorro-antd/upload";
import { IUploadExecutable, IUserJobOptions, IUserJobs } from '../interfaces';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzUploadModule,
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
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsComponent implements OnInit {
  public uploadListOptions = {
    showRemoveIcon: false,
  }
  public readonly memoryOptions = [512, 1024, 2048, 4096, 5120, 6144, 7168, 8192, 9216, 10240];
  public readonly modeOptions = ["cluster", "client"];
  private uploadedFileName = "";
  private defaultJobs:IUserJobs[] = [];
  public deleteDisabled = true;
  public keyValuePairs: {key: string, value: string, disabled?: string}[] = [];
  public fileList: NzUploadFile[] = [];
  public readonly selectedJob = signal<IUserJobs | null>(null)
  public readonly jobs = signal<IUserJobs[]>([]);
  public readonly visibleJobs = computed(() => {
    console.log(this.finishedJobs);
    console.log(this.finishedJobs)
    return this.jobs().filter((job) => {
      if (job.status === "pending" && this.pendingJobs() === true) return true;
      if (job.status === "finished" && this.finishedJobs() === true) return true;
      return false;
    })
  });
  public readonly deleteRequestId = signal<string | null>(null);
  public pendingJobs = signal(true);
  public finishedJobs = signal(true);
  public readonly selectedRequestForm = this.fb.group({
    memory: [0, Validators.required],
    os: ['', Validators.nullValidator],
    "deployMode": ["", Validators.required],
    name: ["", Validators.required],
    class: ["", Validators.required],
    hostname: ["", Validators.nullValidator],
    serviceAccountName: ["", Validators.nullValidator],
    executablePath: ["", Validators.required],
    instances: [0, Validators.required],
    cores: [0, Validators.required],
    image: ["", Validators.nullValidator],
    additionalInfo: [{} as any, Validators.required]
  });
  public constructor(
    public readonly api: ApiService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      const job = this.selectedJob();
      if (!job) return;
      const conf = job?.options.conf;
      this.selectedRequestForm.patchValue({
        memory: conf["spark.executor.memory"],
        instances: conf["spark.executor.instances"],
        cores: conf["spark.executor.cores"],
        image:conf["spark.kubernetes.container.image"],
        os: conf["spark.kubernetes.container.image"],
        name: job.options.name,
        "deployMode": job.options["deployMode"],
        executablePath: job.options.executable as any,
        additionalInfo: job.additionalOptions || {},
        serviceAccountName: conf["spark.kubernetes.authenticate.driver.serviceAccountName"],
        class: job.options.class,
        hostname: job.options.conf['spark.kubernetes.driver.node.selector.kubernetes.io/hostname']
      });
      this.cdr.detectChanges();
      if (job.options.executable) {
        this.handleUploadFileForEdit(job.options.executable);
      }
      if (!job.additionalOptions || !Object.entries(job.additionalOptions)) return;
      Object.entries(job?.additionalOptions || {}).forEach((entry) => {
        const [key, value] = entry;
        this.keyValuePairs.push({key, value, disabled: "false"});
      })
    });
    this.selectedRequestForm.valueChanges.subscribe((data) => {
      console.log(data);
    })
  }

  public async ngOnInit() {
    this.loadRequests();
  }
  public handleFile = (file: NzUploadFile, list: NzUploadFile[]): boolean => {
    this.fileList = [file];
    return false;
  }
  
  private handleUploadFileForEdit(executable: string){
    const filePath = executable;
    const fileName = filePath.split("/")[filePath.split("/").length-1];
    this.fileList = [{uid: `${Math.floor(Math.random() * 100)}`, name: fileName}]
    this.uploadedFileName = fileName;
    this.uploadListOptions.showRemoveIcon = true;
  }

  public addKeyValuePair():void {
    this.keyValuePairs.push({key: "", value: "", disabled: "false"})
  }

  public async save() {
    const request = this.selectedRequestForm.getRawValue();
    if (this.selectedJob()?.id) {
      await this.api.updateJob(this.selectedJob() as IUserJobs);
      return;
    }
    await this.api.createJob({
      username: this.api.getTicket()?.username || "",
      status: "pending",
      priority: 1,
      options: {
        "deployMode": request["deployMode"]!,
        name: request.name!,
        class: request.class!,
        sparkPath: 'opt/spark/bin/spark-submit',
        master: 'k8s://https://192.168.0.201:16443',
        executable: request.executablePath || "",
        conf: {
          "spark.executor.instances": request.instances!,
          "spark.executor.cores": request.cores!,
          "spark.executor.memory": request.memory!,
          "spark.kubernetes.container.image": request.image!,
          "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": request.hostname!,
          "spark.kubernetes.authenticate.driver.serviceAccountName": request.serviceAccountName!
        },
      },
      additionalOptions: {
        ...this.keyValuePairs.reduce((curr)=> {
          const copy = structuredClone(curr) as {key: string, value: string, disabled?: string};
          delete copy.disabled;
          return {...copy, ...curr}
        }, {}) as  any
      }
    });

    this.resetForm();

    await this.loadRequests();
    this.selectedJob.set(null);
  }
  public getNewJobObject(): IUserJobs {
    return {
        user: '', 
        status: 'pending',
        priority: 1, 
        additionalOptions: {} as any,
        timestamp: new Date().getTime(),
        options: {
          sparkPath: 'opt/spark/bin/spark-submit',
          master: 'k8s://https://192.168.0.201:16443', "deployMode": 'cluster',
          name: '', class: '', executable: '',
          conf: {
            "spark.executor.instances": 1,
            "spark.executor.cores": 1,
            "spark.executor.memory": 512,
            "spark.kubernetes.container.image": '',
            "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": 'k8s-1',
            "spark.kubernetes.authenticate.driver.serviceAccountName": 'spark'
          }}
    }
  }
  public async loadRequests() {
    const jobs = await this.api.getUserJobs();
    this.defaultJobs = jobs;
    this.jobs.set(jobs);
  }
  public async deleteRequest(id: string | null) {
    await this.api.deleteJob(`${id}`);

    this.deleteRequestId.set(null);

    await this.loadRequests();
  }
  public resetForm() {
    //do not allow reset if there's no file selected
    if (this.selectedJob()?.id && !this.fileList.length) {
      return;
    }
    this.selectedRequestForm.reset();
    this.fileList = [];
    this.keyValuePairs = [];
    this.keyValuePairs.length = 0;
    this.selectedJob.set(null);
  }
  public editPair(index: number) {
    this.keyValuePairs[index].disabled = this.keyValuePairs[index].disabled === "true" ? "false" : "true";
    this.keyValuePairs = this.keyValuePairs.slice();

  }
  public removePair(index: number) {
    this.keyValuePairs.splice(index, 1);
  }

  public uploadFile() {
    this.api.uploadJobExecutable(this.fileList[0]).then((res: IUploadExecutable) => {
      console.log(res);
      Object.assign(this.uploadListOptions, {
        showRemoveIcon: true,
      })
      this.selectedRequestForm.get('executablePath')?.setValue(res.file_path as any)
      this.uploadedFileName = res.filename;
      this.cdr.detectChanges();
    })
  }

  public deleteUpload = () => { //using arrow function as per ng-zorro docs
    this.api.deleteExecutable(this.uploadedFileName || "").then(() => {
      this.selectedRequestForm.controls.executablePath.setValue("");
      Object.assign(this.uploadListOptions, {
        showRemoveIcon: false,
      })
      this.fileList = [];
      this.cdr.detectChanges();
    }).catch((e) => {
      this.selectedRequestForm.controls.executablePath.setValue("");
      this.cdr.detectChanges();
    });
    return true;
  }

  public stringifyOptions = (data: IUserJobOptions) => {
    let str = JSON.stringify(data["conf"], null, 1);
    str = str.replaceAll('"', "")
    str = str.replaceAll("spark.executor.", "");
    str = str.replaceAll("spark.kubernetes.", "");
    return str;
  }

  public executeJob(data: any) {
    console.log(data);
  }

  
  public sortBy(event: any, key: string) {
    let jobs = this.jobs().slice()
    if (event === "ascend") {
      jobs.sort((a: any, b: any) => {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
        console.log("what")
        return 0;
      });
    }
    else if (event === "descend") {
      jobs.sort((a: any, b: any) => {
        if (!b[key] || !a[key]) return 0;
        if (a[key] < b[key]) return 1;
        if (a[key] > b[key]) return -1;
        return 0;
      });
    }
    else {
      jobs = this.defaultJobs;
    }
    this.jobs.set(jobs);
  }
}

