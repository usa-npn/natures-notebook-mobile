import {Component, ElementRef, OnInit, AfterViewInit, ViewChild, NgZone} from "@angular/core";
import { Progress } from "ui/progress";
import {SyncService} from "../../shared/sync/sync.service";
import {Page} from "tns-core-modules/ui/page";

@Component({
    moduleId: module.id,
    selector: "syncing",
    templateUrl: "./syncing.html",
    styleUrls: ["./syncing-common.scss"]
})
export class SyncingComponent implements OnInit, AfterViewInit {
    public progressValue: number;

    constructor(public _syncService: SyncService,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    onValueChanged(args) {
        let progressBar = <Progress>args.object;

        console.log("Value changed for " + progressBar);
        console.log("New value: " + progressBar.value);
    }

    ngOnInit() {
        this.progressValue = 25;
        setInterval(() => {
            this.progressValue += 1;
        }, 300);
    }
    
    ngAfterViewInit() {
    }
}
