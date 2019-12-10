import {AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef, NgZone} from "@angular/core";
import {Router} from "@angular/router";
import {SyncService} from "../../shared/sync/sync.service";
import {SwipeGestureEventData} from "ui/gestures";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import {ObservationsService} from "../../shared/observations/observations.service";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {SitesService} from "../../shared/sites/sites.service";
import {Individual} from "../../shared/individuals/individual";
import {Site} from "../../shared/sites/site";
import {PeopleService} from "../../shared/people/people.service";
import {SettingsService} from "../../shared/settings/settings.service";
import {ObserveService} from "../observe/observe.service";
import {ModalDialogOptions, ModalDialogService, RouterExtensions} from "nativescript-angular";
import {PickerModal} from "../modals/picker-modal/picker-modal.component";
import {icons} from "../icons";
import {ProtocolPhenophasesService} from "../../shared/phenophases/protocol-phenophases.service";
import {NetworkMonitorService} from "../../shared/network-monitor/network-monitor.service";
import {Page} from "tns-core-modules/ui/page";
// import * as calendarModule from "nativescript-ui-calendar";

import {
    CalendarDayViewStyle,
    CalendarEvent, CalendarMonthViewStyle, CalendarSelectionEventData, DayCellStyle,
    RadCalendar,
    CalendarYearViewStyle,
    MonthCellStyle,
    CellStyle
} from "nativescript-ui-calendar";
import {Color} from "tns-core-modules/color";
import {RadCalendarComponent} from "nativescript-ui-calendar/angular";
import { InformationModal } from "../modals/information-modal/information-modal.component";
var applicationSettings = require("application-settings");
import * as platform from "platform";
import { DayObservationReviewModal } from "./modals/day-observations-review";
import { ModelService } from "../../shared/model/model.service";
import { SyncQueueModal } from "./modals/sync-queue";
import * as application from "tns-core-modules/application";
import {AndroidActivityBackPressedEventData, AndroidApplication} from "tns-core-modules/application";
import { NetworksService } from "~/shared/networks/networks.service";
import { LegendModal } from "./modals/legend";

declare var com: any;

@Component({
    moduleId: module.id,
    selector: "calendar",
    templateUrl: "./calendar.component.html",
    styleUrls: ["./sync-common.scss"]
})
export class CalendarComponent implements OnInit, AfterViewInit {

    constructor(public _syncService: SyncService,
                public _observationsService: ObservationsService,
                public _observationGroupsService: ObservationGroupsService,
                public _protocolPhenophasesService: ProtocolPhenophasesService,
                public _observeService: ObserveService,
                public _individualsService: IndividualsService,
                public _sitesService: SitesService,
                public _networksService: NetworksService,
                public _peopleService: PeopleService,
                public _settingsService: SettingsService,
                public _modelService: ModelService,
                private _networkMonitorService: NetworkMonitorService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _router: RouterExtensions,
                private _zone: NgZone,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    @ViewChild("myCalendar", {static: false}) _calendar: RadCalendarComponent;

    public syncing = false;
    public noConnection = false;
    public noWifi = false;
    refreshIcon = icons.refreshIcon;
    checkIcon = icons.checkIcon;
    timesIcon = icons.timesIcon;
    dropdownIcon = icons.dropdownIcon;
    sortIcon = icons.sortIcon;
    sortAscIcon = icons.sortAscIcon;
    sortDescIcon = icons.sortDescIcon;
    sortNumericAscIcon = icons.sortNumericAscIcon;
    sortNumericDescIcon = icons.sortNumericDescIcon;
    sortAmountAscIcon = icons.sortAmountAscIcon;
    sortAmountDescIcon = icons.sortAmountDescIcon;
    calendarIcon = icons.calendarIcon;
    infoIcon = icons.infoIcon;

    isAndroid: boolean;
    isIOS: boolean;

    public tzoffset;
    public startMonth;
    public endMonth;

    public observationCompleteStatus: Map<Date,boolean> = new Map();
    public unSyncedCount;
    public phenophaseCounts = {};
    public sites: Site[] = [];
    public selectedSite: Site;
    public sortDateDesc: boolean = true;
    public sortUploadedDesc: boolean = false;

    public bullet = '\u2022';
    // color for unicode checkmark ios
    // https://stackoverflow.com/questions/42374048/color-not-changing-for-unicode-check-mark-2714-on-iphone
    public completeIconAndroid = '\u2713';////'\u2611';
    public completeIconIos = '\u2611';//'\u2705';
    public incompleteIconAndroid = '\u25A8'; //square with upper right to lower left fill
    public incompleteIconIos = '\u25A8'; //square with upper right to lower left fill

    public viewMode = "Month";

    public _events: Array<CalendarEvent>;
    private _listItems: Array<CalendarEvent>;

    toggleCalendarViewMode() {
        console.log(this.viewMode);
        if(this.viewMode === "Month") {
            this.viewMode = "Year";
        } else {
            this.viewMode = "Month";
        }
    }

    userDataUpToDate():boolean {
        return (this.unSyncedCount == 0);
    }

    getStatusBarText():string {
        if(this.noConnection) {
            return "No internet connection!";
        } else if(this.noWifi) {
            return "No wifi connection!";
        } else if(this.syncing) {
            return "Syncing data..."
        } else if(this.userDataUpToDate()) {
            return "User data are up to date";
        } else {
            return "User data are not up to date!";
        }
    }

    sync() {
        if(!this._networkMonitorService.connected) {
            this.noConnection = true;
            setTimeout(()=> this.noConnection = false, 4000);
        } else if(this._networkMonitorService.connectionType != 'wifi' && this._settingsService.wifiOnlySync) {
            this.noWifi = true;
            alert("To allow syncing without wifi, select yes for 'Sync Over Wi-Fi' on the settings page.");
            setTimeout(()=> this.noWifi = false, 4000);
        } else {
            this.syncing = true;
            this._syncService.syncAll().then(async () => {
                await this._modelService.loadModel(false);
                this.syncing = false;
                this.unSyncedCount = await this._observationsService.getUnsyncedCount(this._peopleService.selectedPerson.person_id);

                await this.loadSitesAndEvents();
            });
        }
    }

    getUploadedIcon(syncObs: any) {
        if(syncObs.min_sync_status == -1)
            return this.timesIcon;
        else if(syncObs.avg_sync_status == 1)
            return this.checkIcon;
        else return '';
    }

    async popupSitePicker() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                items: this.sites,
                selectedItem: this.selectedSite,
                title: "Choose a site",
                pickerType: "site",
                modelService: this._modelService
            },
            fullscreen: true
        };

        this.modalService.showModal(PickerModal, options).then(async (selectedSite: Site) => {
            if(selectedSite) {
                this.selectedSite = selectedSite;
                this._sitesService.selectedSite = this._sitesService.sites.find(site => {
                    return site.station_id === this.selectedSite.station_id;
                });
                await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
                this._individualsService.selectedIndividual = this._individualsService.individuals.filter(ind => ind.active === 1)[0];
                await this.loadCalendarEvents();
            }
        });
    }

    async popupLegend() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                completeIcon: this.getIconUnicode(true),
                incompleteIcon: this.getIconUnicode(false),
                modelService: this._modelService
            },
            fullscreen: true
        };

        this.modalService.showModal(LegendModal, options).then(async (selectedSite: Site) => {});
    }


    getIconColor(completed: boolean) {
        let green: Color = new Color("#69BD45");
        let yellow: Color = new Color("#E7BF05");
        let grey: Color = new Color("#505050");
        let white: Color = new Color("#ffffff");
        if(platform.isAndroid) {
            if(completed)
                return green;
            else
                return grey;
        } else {
            // for ios hide the event dot by turning it white, and you can't color the text
            return white;
        }
    }

    public getIconUnicode(completed: boolean) {
        if(platform.isAndroid) {
            if(completed)
                return this.completeIconAndroid;
            else
                return this.incompleteIconAndroid;
        } else {
            if(completed)
                return this.completeIconIos;
            else
                return this.incompleteIconIos;
        }
    }

    async loadCalendarEvents() {

        // add 1 week before and after month since calendar sometimes shows days from then
        let eventStartBound = new Date(this.startMonth);
        let eventEndBound = new Date(this.endMonth);
        eventStartBound.setDate(eventStartBound.getDate() - 7);
        eventEndBound.setDate(eventEndBound.getDate() + 7);

        setTimeout( async() => {
            this.observationCompleteStatus = await this._observationsService.getObservationCompleteStatus(
                this._peopleService.selectedPerson.person_id, 
                eventStartBound, 
                eventEndBound, 
                this.selectedSite.station_id, 
                this.phenophaseCounts,
                this._individualsService.individuals.filter(ind => ind.active === 1).length);

            console.log('events for ' + eventStartBound.toISOString() + ' through ' + eventEndBound.toISOString());

            let event: CalendarEvent;
            let events: Array<CalendarEvent> = new Array<CalendarEvent>();
            this.observationCompleteStatus.forEach((completed, day) => {
                if (completed != null) {
                    event = new CalendarEvent(
                        this.getIconUnicode(completed), 
                        day, 
                        day, 
                        false, 
                        this.getIconColor(completed));
                    events.push(event);
                }
            });

            console.log('returning events: ' + events.length);
            this._events = events;

            if(platform.isAndroid) {
                this._calendar.nativeElement.android.getEventAdapter().getRenderer().setEventRenderMode(com.telerik.widget.calendar.events.EventRenderMode.Text);
                this._calendar.nativeElement.android.getEventAdapter().getRenderer().setEventTextSize(70);
            }
        }, 20);
    }

    private async createModelView(date: Date): Promise<any> {
        const options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                selectedSite: this.selectedSite,
                selectedDate: date,
                phenophaseCounts: this.phenophaseCounts
            },
            fullscreen: true,
        };
        return this.modalService.showModal(DayObservationReviewModal, options);
    }

    public async createSyncQueueModelView(): Promise<any> {
        const options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                phenophaseCounts: this.phenophaseCounts
            },
            fullscreen: true,
        };
        return this.modalService.showModal(SyncQueueModal, options);
    }

    public monthViewStyle = new CalendarMonthViewStyle();
    public yearViewStyle = new CalendarYearViewStyle();

    // public dayCellStyle = new CalendarDayViewStyle();

    onCellTap(args: CalendarSelectionEventData) {
        console.log('date selected');
        var calendar: RadCalendar = args.object;
        var date: Date = args.date;
        var events: Array<CalendarEvent> = calendar.getEventsForDate(date);
        this.myItems = events;
        // don't popup on date initialization
        if(this.allowObservationModal) {
            this.createModelView(date);
        }
    }

    onNavigatedToDate(args) {
        console.log('navigated to date ' + args.date.toDateString());
        // get events within selected month
        let d = args.date;
        if (d.getFullYear() != this.startMonth.getFullYear()
            || d.getMonth() != this.startMonth.getMonth()) {
            this.startMonth.setFullYear(d.getFullYear());
            this.startMonth.setMonth(d.getMonth());
            this.endMonth.setFullYear(d.getFullYear());
            this.endMonth.setMonth(d.getMonth()+1);
            console.log('events forr ' + this.startMonth.toDateString() + ' through ' + this.endMonth.toDateString());

            this.loadCalendarEvents();
        }
    }

    public curDate = new Date();
    public allowObservationModal = false;
    onNavigatedToDateEvent(args) {
        console.log('NEW DATE WAS SET!!!!');
        // this._calendar.nativeElement.android.getEventAdapter().getRenderer().setEventRenderMode(com.telerik.widget.calendar.events.EventRenderMode.Text);
        // this._calendar.nativeElement.android.getEventAdapter().getRenderer().setEventTextSize(120);
    }

    onViewModeChanged(args) {
        console.log("view mode was changed.");
        // console.log(args);
    }

    get myItems(): Array<CalendarEvent> {
        return this._listItems;
    }

    set myItems(value) {
        this._listItems = value;
    }

    // onInlineEventSelectedEvent() {
    //     alert('you tapped an event');
    // }

    popupWifiReminder() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                headerText: "Tip",
                informationText: "By default, your observations will only sync when wi-fi access is available. You can change this under the settings tab by selecting No for Sync over wi-fi only."
            },
            fullscreen: false
        };

        this.modalService.showModal(InformationModal, options).then(() => {
            applicationSettings.setBoolean("userHasSeenWifiReminder", true);
        });
    }

    async loadSitesAndEvents() {
        this.selectedSite = this._sitesService.selectedSite;
        this.sites = this._sitesService.sites.filter(site => {
            if (this._networksService.selectedNetwork.network_id != -1) {
                return this._networksService.selectedNetwork.network_id === site.network_id;
            } else {
                return !site.network_id;
            }
        });

        // load events for the current month
        var d = new Date();
        this.startMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        this.endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        await this.loadCalendarEvents();
        this.isLoading = false;
    }

    isLoading:boolean;
    async ngOnInit() {
        this.isLoading = true;
        this.isAndroid = platform.isAndroid;
        this.isIOS = platform.isIOS;
        this.tzoffset = (new Date()).getTimezoneOffset() * 60000;

        let dayCellStyle = new DayCellStyle();
        dayCellStyle.showEventsText = true;
        dayCellStyle.eventFontName = "FontAwesome";
        dayCellStyle.eventTextSize = 13;
        dayCellStyle.cellPaddingHorizontal = 5;
        dayCellStyle.cellPaddingVertical = 5;
        dayCellStyle.cellBorderWidth = .5;
        // dayCellStyle.cellBorderColor = "#d3d3d3";
        // dayCellStyle.cellTextFontStyle = "Bold";
    
        //remove border around today
        this.monthViewStyle.todayCellStyle = dayCellStyle;
        this.monthViewStyle.dayCellStyle = dayCellStyle;

        let monthCellStyle = new MonthCellStyle();
        // monthCellStyle.effectivePaddingLeft = 0;
        // monthCellStyle.effectiveMarginLeft = 0;
        // monthCellStyle.dayNameTextSize = 8;
        // monthCellStyle.dayTextSize = 8;
        // monthCellStyle.style.padding = '10px';
        // monthCellStyle.monthNameTextColor = "blue";
        this.yearViewStyle.monthCellStyle = monthCellStyle;

        let titleCellStyle = new CellStyle();
        titleCellStyle.cellPaddingVertical = 0;
        this.yearViewStyle.titleCellStyle = titleCellStyle;
       
        this.curDate = new Date();

        setTimeout(() => {this.allowObservationModal = true;}, 250);
    }

    async ngAfterViewInit() {
        this.phenophaseCounts = await this._protocolPhenophasesService.getProtocolPhenophaseCounts();

        // call three times because the user could have just came from the observe screen
        // where a sync might have happened in the background so have to keep checking the database for updated values
        setTimeout(async() => {
            this.unSyncedCount = await this._observationsService.getUnsyncedCount(this._peopleService.selectedPerson.person_id);
        }, 20);

        setTimeout(async() => {
            this.unSyncedCount = await this._observationsService.getUnsyncedCount(this._peopleService.selectedPerson.person_id);
        }, 3000);

        setTimeout(async() => {
            this.unSyncedCount = await this._observationsService.getUnsyncedCount(this._peopleService.selectedPerson.person_id);
        }, 8000);

        await this.loadSitesAndEvents();

        if(!applicationSettings.getBoolean("userHasSeenWifiReminder")) {
            this.popupWifiReminder();
        }
    }

}
