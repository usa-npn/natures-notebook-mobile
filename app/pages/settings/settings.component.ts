import {Component, OnInit, ViewContainerRef, ViewChild, ElementRef} from "@angular/core";
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService, RouterExtensions} from "nativescript-angular";
import {SettingsService} from "../../shared/settings/settings.service";
import {SwipeGestureEventData} from "ui/gestures";
import {GC} from "tns-core-modules/utils/utils";
import {icons} from "../icons";
import {Page} from "tns-core-modules/ui/page";
import { PeopleService } from "../../shared/people/people.service";
import { AndroidApplication, AndroidActivityBackPressedEventData } from "tns-core-modules/application/application";
import * as application from "tns-core-modules/application";
import { PrivacyModal } from "./privacy-modal/privacy-modal.component";
import { ConfigService } from "~/shared/config-service";
import { DatabaseService } from "~/shared/database/database.service";
import { ToolTipModal } from "../observe/modals/tooltip";

@Component({
    moduleId: module.id,
    selector: "settings",
    templateUrl: "./settings.html",
    styleUrls: ["./settings-common.scss"],
    providers: []
})
export class SettingsComponent implements OnInit {

    constructor(public _settingsService: SettingsService,
                private _peopleService: PeopleService,
                private modalService: ModalDialogService,
                public _configService: ConfigService,
                private _databaseService: DatabaseService,
                private viewContainerRef: ViewContainerRef,
                private _router: Router,
                private _routerExtensions: RouterExtensions,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    @ViewChild("privacyWebView", {static: false}) privacyWebView: ElementRef;

    infoIcon = icons.infoIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;
    groupIcon = icons.groupIcon;
    chevronLeft = icons.faArrowLeft;
    chevronRight = icons.faArrowRight;

    wifiOnlySync: boolean;
    recordObservationTime: boolean;
    useSimplifiedProtocols: boolean;

    debugCounter: number;

    systemDatabaseVersion;

    popupInfo(infoPressed) {
        let tipText = "";
        if (infoPressed == "wifi-only")
            tipText = `Sync Over Wi-Fi Only - With this setting enabled, Nature's Notebook will only attempt to send data back to the NPN when the phone is actively connected to  Wi-Fi. This is useful if you have a low bandwidth phone plan or you spend a lot of time recording data in remote places without a connection. This is enabled by default.`;
        else if (infoPressed == "include-time")
            tipText =
            `Include Time in Dates Observed - With this setting enabled, you can recod the time of day in addition to the date, when making observations. This is useful if you observe a lot of animals and want to capture the exact time of day. This is disabled by default.`;
    
        let options: ModalDialogOptions = {
        viewContainerRef: this.viewContainerRef,
        context: {
            tipText: tipText
        },
        fullscreen: false
        };

        this.modalService.showModal(ToolTipModal, options).then(() => {});

    }

    toggleWifiOnlySync(radioValue: boolean) {
        this.wifiOnlySync = radioValue;
        this._settingsService.wifiOnlySync = radioValue;
    }

    toggleRecordObservationTime(radioValue) {
        this.recordObservationTime = radioValue;
        this._settingsService.recordObservationTime = radioValue;
    }

    toggleUseSimplifiedProtocols(radioValue) {
        this.useSimplifiedProtocols = radioValue;
        this._settingsService.useSimplifiedProtocols = radioValue;
    }

    incrementDebug() {
       this.debugCounter ++;
       if (this.debugCounter > 5) {
           this._router.navigate(["/debug"]);
       }
    }

    webViewBack() {
        this.privacyWebView.nativeElement.goBack();
    }

    webViewForward() {
        this.privacyWebView.nativeElement.goForward();
    }

    popupPrivacy() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {},
            fullscreen: true
        };

        this.modalService.showModal(PrivacyModal, options).then(() => {});
    }

    getBackgroundColor() {
        switch(this.debugCounter) {
            case 0:
              return '#dbdbdb';
            case 1:
                return '#d6d6d6';
            case 2:
                return '#cecece';
            case 3:
                return '#c4c4c4';
            case 4:
                return '#bcbcbc';
            case 5:
                return '#b7b7b7';
            case 6:
                return '#b2b2b2';
            default:
                return '#afafaf';
          }
    }

    getVersion() {
        return `Version: ${this._configService.version} (db version: ${this.systemDatabaseVersion}) ${this._configService.releaseType}`;
    }

    getAccountEmail() {
        if (!this._peopleService.selectedPerson)
            return '';
        return this._peopleService.selectedPerson.email;
    }

    manageAccounts() {
        this._router.navigate(["/accounts"]);
    }

    isLoading:boolean;
    async ngOnInit() {
        // this.isLoading = true;
        // setTimeout(() => {
        //     this.isLoading = false;
        // }, 500);
        this.wifiOnlySync = this._settingsService.wifiOnlySync;
        this.recordObservationTime = this._settingsService.recordObservationTime;
        this.useSimplifiedProtocols = this._settingsService.useSimplifiedProtocols;
        this.debugCounter = 0;
        this.systemDatabaseVersion = await this._databaseService.getSystemDbVersion();

        // application.android.removeEventListener(AndroidApplication.activityBackPressedEvent);
        // application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
        //     console.log('intercccepting android back button');
        //     data.cancel = true; // prevents default back button behavior
        //     this._routerExtensions.back();
        // });
    }
}
