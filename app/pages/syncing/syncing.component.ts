import {Component, ElementRef, OnInit, AfterViewInit, ViewChild, NgZone} from "@angular/core";
import { Progress } from "@nativescript/core/ui/progress";
import {SyncService} from "../../shared/sync/sync.service";
import {Page} from "@nativescript/core/ui/page";
import { ApplicationSettings } from "@nativescript/core";

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
        // page.actionBarHidden = true;
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

        //if on screen for more than 10 seconds without syncing anything
        // setTimeout(()=> {
        //     if(this._syncService.currentlySyncing == '') {
        //         // get info about variables and send to developer
        //         for( let k in ApplicationSettings.getAllKeys()) {
        //             console.log(k);
        //             console.log(ApplicationSettings.getString(k));
        //         }
        //         //clear everything stored in applicationSettings
        //         ApplicationSettings.clear();
        //         //clear database tables (or delete and redownload)


        //         //take user to login screen
        //         this._router.navigate(["/login"]);
        //     }
        // }, 1000)
    }
    
    ngAfterViewInit() {
    }
}
