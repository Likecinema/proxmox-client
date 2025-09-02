import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, Injectable, OnInit, Signal, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzModalModule, NzModalService } from "ng-zorro-antd/modal";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { ApiService } from "../api.service";
import { NzMessageService } from "ng-zorro-antd/message"
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { FormsModule } from "@angular/forms";
import { NzInputModule } from "ng-zorro-antd/input";

@Injectable({
    providedIn: "root",
})
@Component({
    selector: 'app-user-tasks',
    standalone: true,
    imports: [
        CommonModule,
        NzModalModule,
        NzButtonModule,
        NzTableModule,
        NzSpinModule,
        NzIconModule,
        NzMenuModule,
        FormsModule,
        NzInputModule,
    ],
    templateUrl: './user-menu.html',
    styleUrl: './user-menu.component.css',
})

export class UserMenuComponent implements AfterViewInit {
    public isVisible = true;
    private userId: string | null = null;
    public data: {0: string, 1: string, 2: string, 3: string, 4: string, 5:string}[] = [];
    public error = "";
    public isLoaded = false;
    public searchValue: string | null = null;
    public isJobs = this.router.url.split("/")[this.router.url.split("/").length - 1] === "jobs";
    private menuChange = false;
    public constructor(
        private router: Router,
        private route: ActivatedRoute,
        private api: ApiService,
        private message: NzMessageService,
    ) {
    }


    ngAfterViewInit(): void {
        this.userId = this.route.snapshot.params["id"];
        if (!this.userId) {
            this.message.error("No user selected");
            this.isVisible = false;
        }
        const cb = (res: any[], keys: string[]) => {
            res.forEach(value => {
                if (value.vmDetails) {
                    value = {
                        ...value,
                        ...value.vmDetails,
                    }
                }
                this.data.push({
                    0: value[keys[0]] || "",
                    1: value[keys[1]] || "",
                    2: value[keys[2]] || "",
                    3: value[keys[3]] || "",
                    4: value[keys[4]] || "",
                    5: ""
                })
                this.isLoaded = true;
                this.menuChange = false;
            });
        }
        const keys = this.isJobs ? "id,priority,timeStamp,options".split(",") : "startDate,endDate,processors,memoryGb,storageGb".split(",")
        const promise = this.isJobs && this.userId ? this.api.getUserJobs(this.userId) : this.api.getRequests();
        promise.then((res) => cb(res,keys)).catch((e) => {
            this.message.error(`Error occured: ${e.toString()}`, {nzPauseOnHover: true});
            console.error(e);
            this.nzAfterClose();
        })
    }

    handleOk(): void {
        this.isVisible = false;
    }

    handleCancel(): void {
        this.isVisible = false;
    }
    nzAfterClose(): void {
        if (!this.menuChange) {
            this.router.navigate(["../../"], {relativeTo: this.route, replaceUrl: true})
        }
    }

    search() {

    }

    clearSearch() {

    }
    handleMenuChange() {
        this.isVisible=true;
        this.menuChange = true;
        const path = this.router.url.split("/");
        const request = path[path.length - 1] === "jobs" ? "requests" : "jobs";
        this.router.navigate([`../${request}`], {relativeTo: this.route, replaceUrl: true})
    }
}