import {Component, ViewChild, OnInit, ViewContainerRef, OnDestroy} from "@angular/core";
import {SpeciesService} from "../../shared/species/species.service";
var http = require("http");
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService} from "@nativescript/angular";
import {DateTimePickerModal} from "./modals/date-time-picker-modal.component";
import {SettingsService} from "../../shared/settings/settings.service";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import {Subscription} from "rxjs";
import {SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {ObserveService} from "./observe.service";
import {SitesService} from "../../shared/sites/sites.service";
import {icons} from "../icons";
import {PeopleService} from "../../shared/people/people.service";
import {Page} from "@nativescript/core/ui/page";
import { InformationModal } from "../modals/information-modal/information-modal.component";
import { SyncService } from "../../shared/sync/sync.service";
var applicationSettings = require("@nativescript/core/application-settings");

@Component({
    moduleId: module.id,
    selector: "sites",
    templateUrl: "./observe.html",
    styleUrls: ["./observe-common.scss"],
    providers: []
})
export class ObserveComponent implements OnInit, OnDestroy {

    constructor(private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _speciesService: SpeciesService,
                public _router: Router,
                private _settingsService: SettingsService,
                public _individualsService: IndividualsService,
                public _observationGroupsService: ObservationGroupsService,
                private _observeService: ObserveService,
                public _sitesService: SitesService,
                private _syncService: SyncService,
                public _peopleService: PeopleService,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    activeTab = "site-visit-details";
    calendarIcon = icons.calendarIcon;
    clockIcon = icons.clockIcon;
    infoIcon = icons.infoIcon;
    dropdownIcon = icons.dropdownIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;
    backwardIcon = icons.backwardIcon;
    notificationIcon = icons.notificationIcon;

    @ViewChild('plantsChild', {static: false}) plantsChild;
    @ViewChild('animalsChild', {static: false}) animalsChild;
    @ViewChild('animalsChecklistChild', {static: false}) animalChecklistChild;
    @ViewChild('siteVisitDetailsChild', {static: false}) siteVisitDetailsChild;

    // cont is just a function that you want to fire after the subpage has been saved
    // by default it is just set to an empty function (i.e. do nothing)
    async saveSubpage(cont = () => {}) {
        if(this.observationDate == null) {
           cont();
        }
        else if (this.activeTab === 'plants') {
            await this.plantsChild.saveObservations();
            this._syncService.syncObservations();
            cont();
        } else if (this.activeTab === 'animals-checklist') {
            await this.animalChecklistChild.saveAndSync(cont);
        }
        else if (this.activeTab === 'site-visit-details') {
            await this.siteVisitDetailsChild.saveAndSync(cont);
        }
    }

    async changePage(tabPressed) {
        this.activeTab = tabPressed;
        // let cont = () => {this.activeTab = tabPressed;};
        // await this.saveSubpage(cont);

    }

    popupInfo(infoPressed) {

    }

    public observationDate:Date;
    public popupDateTimePicker() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                recordObservationTime: this._settingsService.recordObservationTime,
                observationDate: this.observationDate || new Date()
            },
            fullscreen: true
        };

        this.modalService.showModal(DateTimePickerModal, options).then(async (date) => {
            // here the continuation is to set the selected observation group and change the date,
            // this can get cancelled though if all animals have been observed for the current date and the user wants
            // to set the obs details via the popup reminder
            if (date) {
                let cont = () => {};
                cont = async () => {
                        await this._observationGroupsService.setSelectedObservationGroup(date, this._sitesService.selectedSite, this._peopleService.selectedPerson).then( ()=> {
                        this._observationGroupsService.selectedDate.next(date);
                    });
                };
                await this.saveSubpage(cont);
            }
        })
    }

    popupSiteVisitDetailsReminder() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                headerText: "Reminder",
                informationText: "After you record observations for plants and animals, don't forget to enter details in the site-visit details tab."
            },
            fullscreen: false
        };

        this.modalService.showModal(InformationModal, options).then(() => {
            applicationSettings.setBoolean("userHasSeenSiteVisitDetailsReminder", true);
        });
    }

    public isLoading: boolean;
    private subscriber: Subscription;
    private selectedTabSubscriber: Subscription;
    async ngOnInit() {
        this.isLoading = true;

        if (!this._individualsService.individuals) {
            await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        }
        this.isLoading = false;

        if(!applicationSettings.getBoolean("userHasSeenSiteVisitDetailsReminder")) {
            this.popupSiteVisitDetailsReminder();
        }
        
        console.log('in ngOnInit for observe.component');
        this.subscriber = this._observationGroupsService.selectedDate.subscribe((date: Date) => {
            this.observationDate = date;
        });
        this.selectedTabSubscriber = this._observeService.selectedTab.subscribe((selectedTab: string) => {
            this.activeTab = selectedTab;
        });
    }

    ngOnDestroy() {
        this.subscriber.unsubscribe();
    }
}