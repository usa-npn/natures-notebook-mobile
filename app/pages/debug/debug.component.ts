import {
    Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectionStrategy,
    ViewContainerRef, ChangeDetectorRef
} from "@angular/core";
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService} from "@nativescript/angular";
import {SettingsService} from "../../shared/settings/settings.service";
import {SwipeGestureEventData} from "@nativescript/core/ui/gestures";
//import {GC} from "tns-core-modules/utils/utils";
import * as dialogs from "@nativescript/core/ui/dialogs";


import * as application from "@nativescript/core/application";
var appModule = require("@nativescript/core/application");
import * as fs from "@nativescript/core/file-system";
import {PeopleService} from "../../shared/people/people.service";
import {icons} from "../icons";
import {Page} from "@nativescript/core/ui/page";
import { ConfigService } from "~/shared/config-service";
import { DatabaseService } from "~/shared/database/database.service";
var http = require("http");
var bghttp = require("nativescript-background-http");
var session = bghttp.session("image-upload");


@Component({
    moduleId: module.id,
    selector: "debug",
    templateUrl: "./debug.html",
    styleUrls: ["./debug-common.scss"],
    providers: []
})
export class DebugComponent implements OnInit, AfterViewInit {

    constructor(private _settingsService: SettingsService,
                private _peopleService: PeopleService,
                public _configService: ConfigService,
                public _databaseService: DatabaseService,
                private cdr: ChangeDetectorRef,
                private _router: Router,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    uploadIcon = icons.uploadIcon;
    backwardIcon = icons.backwardIcon;
    bugIcon = icons.bugIcon;
    checkmarkIcon = icons.checkmarkIcon;
    checkIcon = icons.checkIcon;
    sad2Icon = icons.sad2Icon;
    trashIcon = icons.trash;
    lockbuttons = true;

    databaseUploaded: boolean;
    databaseProgress: number;
    databaseError: boolean;
    databaseButtonText: string;
    databaseButtonImage: string;
    unsyncedObsRemoved: boolean;
    removeObsButtonText: string;
    removeObsButtonImage: string;

    problemText: string;
    systemDbVersion;

    async deleteUnsyncedObservations() {
        if (this.lockbuttons || this.unsyncedObsRemoved) {
            return;
        }
        dialogs.confirm({
            message: "This will permantly delete any unsynced observations.", 
            okButtonText: "Ok",
            neutralButtonText: "Cancel",
        }).then(async (result) => {
            if (result) {
                let query1 = `DELETE FROM observations WHERE sync_status = 0`;
                await this._databaseService.runQuery(this._databaseService.db, query1);
                let query2 = `DELETE FROM observation_groups WHERE sync_status = 0`;
                await this._databaseService.runQuery(this._databaseService.db, query2);
                this.removeObsButtonText = "Unsynced observations have been removed";
                this.removeObsButtonImage = this.checkIcon;
                this.unsyncedObsRemoved = true;
            }
        });
        
    }

    uploadDatabase() {
        if (this.lockbuttons || this.databaseUploaded) {
            return;
        }
        let dbname = '';
        let path = '';
        if (application.ios) {
            path = fs.knownFolders.documents().path;
            dbname = path + '/natures_notebook.db'
        } else {
            dbname = appModule.android.context.getDatabasePath("natures_notebook.db").getAbsolutePath();
            path = dbname.substr(0, dbname.lastIndexOf('/') + 1);
        }
        console.log('dbname: ' + dbname);
        console.log('database path: ' + path);
        var file = fs.File.fromPath(dbname);
        var request = {
            url: `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/webservices/upload`,
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                "File-Name": "database"
            },
            description: "{ 'uploading': 'natures_notebook.db' }"
        };

        let uploadDateString = new Date().toISOString();

        let params = [
            {
                name: "person_id",
                value: this._peopleService.selectedPerson.person_id.toString()
            },
            {
                name: "username",
                value: this._peopleService.selectedPerson.username
            },
            {
                name:"issueDateTime",
                value: uploadDateString
            },
            {
                name: "email",
                value: this._peopleService.selectedPerson.email
            },
            {
                name: "problem_text",
                value: 'db version: ' + this.systemDbVersion + ' app version: ' + this._configService.version + ' ' + this.problemText
            },
            {
                name:"file",
                filename: dbname,
                mimeType: 'application/x-sqlite3'
            }
        ];

        console.log('check me');
        console.log(params[0]['issueDateTime']);

        var task = session.multipartUpload(params, request);

        task.on("progress", (e) => {
            console.log('progress');
            this.databaseProgress = e.currentBytes / e.totalBytes;
            this.databaseButtonText = "Reporting Issue: " + (this.databaseProgress * 100).toPrecision(3) + "%";
            console.log(this.databaseButtonText);
            this.cdr.detectChanges();
        });
        task.on("error", (e) => {
            console.log('error');
            this.databaseButtonText = "Error Reporting Issue";
            this.databaseButtonImage = this.sad2Icon;
            this.cdr.detectChanges();
        });
        task.on("complete", (e) => {
            console.log('complete');
            this.databaseUploaded = true;
            this.databaseButtonText = "Issue Reported Successful";
            this.databaseButtonImage = this.checkmarkIcon;
            this.cdr.detectChanges();
        });
    }

    goToSettings() {
        this._router.navigate(["/settings"]);
    }

    async ngOnInit() {
        this.lockbuttons = true;
        this.unsyncedObsRemoved = false;
        this.databaseUploaded = false;
        this.databaseError = false;
        this.databaseProgress = 0;
        this.databaseButtonText = "Submit Issue";
        this.databaseButtonImage = this.uploadIcon;
        this.removeObsButtonText = "Clear Unsynced Observations";
        this.removeObsButtonImage = this.trashIcon;
        this.problemText = '';
        this.systemDbVersion = await this._databaseService.getSystemDbVersion();
        // to prevent accidentally tapping button when screen first appears
        setTimeout(() => { this.lockbuttons = false;}, 3000);
    }

    ngAfterViewInit() {
    }
}
