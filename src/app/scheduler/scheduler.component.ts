import { ChangeDetectionStrategy, Component, ViewChild, signal, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventDropArg, EventInput } from '@fullcalendar/core'; // useful for typechecking
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { NzContentComponent, NzHeaderComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import { ApiService } from '../api.service';
import { EventImpl } from '@fullcalendar/core/internal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import JobUtils from '../../utils/scheduler/jobUtils';
import RequestUtils from '../../utils/scheduler/requestUtils';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IScheduleJobNode, IUserJobs } from '../interfaces';


@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [NzSelectModule, NzTableModule,CommonModule, NzInputNumberModule, NzModalModule, FormsModule, NzDropDownModule ,NzToolTipModule ,NzButtonComponent, FullCalendarModule, NzContentComponent, NzLayoutComponent, NzHeaderComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulerComponent {
  private requests: EventImpl[] = [];
  private jobs: EventImpl[] = [];
  public editedEvents = signal<EventImpl[]>([])
  public selectedEvent = signal<any>(undefined)
  public nodes: IScheduleJobNode[] = []
  public activeNode: string|null = null;
  private eventsEditable = false;
  public jobHours = 8;
  public retryHours = 2;
  @ViewChild('calendar') calendar?: FullCalendarComponent;
  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',
    firstDay: 0,
    plugins: [timeGridPlugin, interactionPlugin],
    editable: false,
    droppable: false,
    eventResizableFromStart: false,
    height: "auto",
    views: {
      timeGridWeek: {
        allDaySlot: false,
        slotDuration: '00:30:00', // Customize slot duration if needed
        slotLabelInterval: '01:00' // Customize label interval
  
      }
    },
    eventConstraint: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
      end: new Date("2500-11-31").toISOString() //hardcoded value
    },
    eventClick: (info) => {
      const objToKeyValue = (o: {[key:string]: string}, arr: {[key:string]: string}[] = []) => {
        for (const [key, value] of Object.entries(o)) {
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            arr = arr.concat(objToKeyValue(value, []))
          }
          else {
            arr.push({key: key, value: value});
          }
        }
        return arr;
      }
      const createEventImpl = (event: EventImpl) => {
        const actual = event.extendedProps["job"] || event.extendedProps["request"];
        const content = objToKeyValue(actual, []);
        content.push({key: "Assigned to Node", value: event.extendedProps["nodeId"] || ""});
        return content;
      }
      this.selectedEvent.set(createEventImpl(info.event))
      info.el.focus();
    },
    eventDrop: (info: EventDropArg) => {
      if (<Date>info.oldEvent.start < new Date()) {
        info.revert();
        return;
      }
      let event
      if (info.event.extendedProps["job"]) {
        event = this.jobs.filter((event: EventImpl) => event.id === info.event.id)[0];
      }
      else {
        event = this.requests.filter((event: EventImpl) => event.id === info.event.id)[0];
      }
      event.setExtendedProp("edited", true);
      this.editedEvents.set(this.getEditedEvents())
      this.editedEvents.set(this.getEditedEvents())
    },
    eventResize: (info: EventResizeDoneArg) => {
      if (<Date>info.oldEvent.start < new Date()) {
        info.revert();
        return;
      }
      let event;
      if (info.event.extendedProps["job"]) {
        event = this.jobs.filter((event: EventImpl) => event.id === info.event.id)[0];
      }
      else {
        event = this.requests.filter((event: EventImpl) => event.id === info.event.id)[0];
      }
      event.setExtendedProp("edited", true);
      this.editedEvents.set(this.getEditedEvents())
    }
  };
  public constructor(
    public readonly api: ApiService,
    public readonly message: NzMessageService
  ) {
    this.api.getRequests().then((res) => {
      const api  = this.calendar?.getApi();
      res.forEach((req) => {
        const events = RequestUtils.convertRequestToEvents(req);
        for (const event of events) {
          this.requests.push(<EventImpl>api?.addEvent(event));
        }
      })
    });
    this.api.getUserJobs().then((res) => {
        res.forEach((job) => {
          const event = JobUtils.convertJobToEvent(job);
          const eventObj = this.calendar?.getApi().addEvent(event) as EventImpl
          this.jobs.push(eventObj);
        })
      }
    )
    this.api.getNodeInfo().then((res) => {
      res.forEach((nodeInfo) => {
        this.nodes.push({
          id: nodeInfo.id,
          cores: nodeInfo.maxcpu,
          memory: nodeInfo.maxmem / 1024 / 1024 / 1024,
          storage: nodeInfo.maxdisk / 1024 / 1024 / 1024,
          usage: [],
        })
      })
    })
  }

  public toggleEditableEvents() {
    const api = this.calendar?.getApi();
    this.eventsEditable = !this.eventsEditable;
    api?.setOption("editable", this.eventsEditable);
    api?.setOption("eventResizableFromStart", this.eventsEditable);
    api?.setOption("droppable", this.eventsEditable);
  };

  public async autoSchedule(hoursPerJob:number, retryHours: number) {
    this.requests.sort((a, b) =>  {
      const dateA = <Date>a?.start;
      const dateB = <Date>b?.start;
      return dateA.getTime() - dateB.getTime();
    })
    this.jobs.sort((a, b) =>  {
      const jobA = <IUserJobs>a.extendedProps?.["job"] || {timestamp: 0}
      const jobB = <IUserJobs>b.extendedProps?.["job"] || {timestamp: 0}
      return jobA.timestamp - jobB.timestamp
    })
  const pendingRequests = this.requests.filter((event) => <Date>event?.start > new Date());
  const pendingJobs = this.getPendingJobs();
  this.scheduleEvents(<EventImpl[]>pendingRequests, this.nodes, retryHours);
  this.scheduleJobs(pendingJobs, this.nodes, retryHours, hoursPerJob)
  this.editedEvents.set(this.getEditedEvents())
  }

  public getPendingJobs() {
    return this.jobs.filter((job) => {
      if (!job.extendedProps?.['job']) {
        return false;
      }
      const userJob = job.extendedProps?.['job'] as IUserJobs
      return userJob.status === "pending";
    })
  }

  private scheduleJobs(jobs: EventImpl[], nodes: IScheduleJobNode[], retryHours: number, hoursPerJob: number) {
    for (const event of jobs) {
      let sumOfRetryHours = 0;
      let added;
      do {
        added = JobUtils.scheduleJob(event, nodes, sumOfRetryHours, hoursPerJob);
        if (added < 0) {
          this.message.create("error", `Failed to add job ${event.extendedProps["job"].id}`)
          console.error(`Failed to add job ${event.extendedProps["job"].id}`)
          break;
        }
        event.setProp("display", "auto");
        sumOfRetryHours += retryHours;
      } while(added === 0);
    }
  }

  private scheduleEvents(events: EventImpl[], nodes: IScheduleJobNode[], retryHours: number) {
    for (const event of events) {
      let added = RequestUtils.scheduleEvent(event, nodes)
      do  {
        if (added > 0) {
          break;
        }
        if (added < 0) {
          event.setProp("backgroundColor", "red");
          event.setExtendedProp("nodeId", "Failed");
          this.message.create("error", `Failed to add Request ${event.extendedProps["request"].id}`)
          console.error(`Failed to add Request ${event.extendedProps["request"].id}`)
          break;
        }
        const oldStart = <Date>event.start;
        const oldEnd = <Date>event.end;
        oldStart.setHours(oldStart.getHours() + retryHours);
        oldEnd.setHours(oldEnd.getHours() + retryHours);
        event.setDates(oldStart, oldEnd)
        added = RequestUtils.scheduleEvent(event, nodes)
      } while (added === 0)
      event.setProp("display", "auto");
    }
  }

  public stopDropdownHide(e: Event) {
    e.stopPropagation();
  }

  public getEditedEvents() {
    const allEvents = this.jobs.concat(this.requests);
    return allEvents.filter((event) => event.extendedProps["edited"] === true);
  }

  public async updateEvents() {
    const allEvents = this.getEditedEvents();
    for (const event of allEvents) {
      switch (true) {
        case (!!event.extendedProps["job"]):
          await this.api.updateJob(event.extendedProps["job"]);
          event.setExtendedProp("edited", false)
          break;
        case (!!event.extendedProps["request"]):
          //await this.api.updateEvent(event.extendedProps["request"])
          event.setExtendedProp("edited", false)
          break;
        default: 
          throw "Unknown type";
      }
    }
  }

  public showNodeRequests(event: string) {
    console.log(this.requests.filter((r) => r.extendedProps["request"].node === event))
    console.log(event);
    this.requests.forEach((r) => r.setProp("display", "none"))
    this.requests.filter((r) => r.extendedProps["request"].node === event).forEach((r) => {
      r.setProp("display", "auto");
    })
  }
 }