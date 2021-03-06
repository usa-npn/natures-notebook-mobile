import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, ViewContainerRef} from '@angular/core';
import {ModalDialogParams, ModalDialogService} from "nativescript-angular/modal-dialog";
import { Page } from 'ui/page';
import { Color } from 'color';
import * as utils from 'utils/utils';
import {icons} from "../../icons";
import { Observation } from '../../../shared/observations/Observation';
import { SettingsService } from '../../../shared/settings/settings.service';
import { SyncService } from '../../../shared/sync/sync.service';
import { ObservationsService } from '../../../shared/observations/observations.service';
import { ObservationGroupsService } from '../../../shared/observation-groups/observation-groups.service';
import { ProtocolPhenophasesService } from '../../../shared/phenophases/protocol-phenophases.service';
import { ObserveService } from '../../observe/observe.service';
import { IndividualsService } from '../../../shared/individuals/individuals.service';
import { SitesService } from '../../../shared/sites/sites.service';
import { PeopleService } from '../../../shared/people/people.service';
import { NetworkMonitorService } from '../../../shared/network-monitor/network-monitor.service';
import { Router } from '@angular/router';
import { Site } from '../../../shared/sites/site';
var applicationSettings = require("application-settings");

@Component({
    moduleId: module.id,
    templateUrl: "./sync-queue.html",
})
export class SyncQueueModal implements OnInit {

    public observations: any[] = [];
    public phenophaseCounts = {};

    public syncing = false;
    public noConnection = false;
    public noWifi = false;
    public loading = true;

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

    public sortDateDesc: boolean = true;
    public sortTimeDesc: boolean = false;

    constructor(
        private params: ModalDialogParams, 
        public _syncService: SyncService,
        public _observationsService: ObservationsService,
        public _observationGroupsService: ObservationGroupsService,
        public _protocolPhenophasesService: ProtocolPhenophasesService,
        public _observeService: ObserveService,
        public _individualsService: IndividualsService,
        public _sitesService: SitesService,
        public _peopleService: PeopleService,
        public _settingsService: SettingsService,
        private _networkMonitorService: NetworkMonitorService,
        private modalService: ModalDialogService,
        private viewContainerRef: ViewContainerRef,
        private _router: Router,
        private page:Page) {

        this.phenophaseCounts = params.context.phenophaseCounts;

        this.page.on("unloaded", () => {
            // using the unloaded event to close the modal when there is user interaction
            // e.g. user taps outside the modal page
            this.params.closeCallback();
        });
    }

    getObservationTime(o): string {
        if (!o.observation_date || o.observation_date as string === "") {
            return "none"
        }
        let d = new Date(o.observation_date);
        if(o.user_time) {
            return `${d.getHours()}:${d.getMinutes()}`;
        } else {
            return `none`;
        }
    }


    async onSelectObservation(item) {
        // select group

        // select site
        this._sitesService.selectedSite = this._sitesService.sites.find(site => {
            return site.station_id === item.station_id;
        });
        // select individual
        await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        this._individualsService.selectedIndividual = this._individualsService.individuals
            .filter(ind => ind.active === 1)
            .find(individual => {
                return individual.individual_id === item.individual_id;
            });
        // select date and observation group
        let date = new Date(item.observation_date);
        await this._observationGroupsService.setSelectedObservationGroup(date,
            this._sitesService.selectedSite, this._peopleService.selectedPerson).then( ()=> {
            this._observationGroupsService.selectedDate.next(date);
        });
        // test if plant or animal to set correct observation subtab
        if (this._individualsService.selectedIndividual.species.kingdom === 'Animalia') {
            this._observeService.selectedTab.next('animals-checklist');
        } else {
            this._observeService.selectedTab.next('plants');
        }
        this.submit();
        this._individualsService.fromReviewScreen = true;
        setTimeout(() => {this._router.navigate(["/observe"]);}, 10);
    }

    ngOnInit() {
        setTimeout(async () => {
            this.observations = await this._observationsService.getUnsyncedObservations(this._peopleService.selectedPerson.person_id);
            this.loading = false;
        }, 300);
    }

    public submit() {
        this.params.closeCallback();
    }
}