import {Component, OnInit, ViewContainerRef} from "@angular/core";
import {Species} from "../../shared/species/species";
import {SpeciesService} from "../../shared/species/species.service";
var http = require("http");
import {Router} from "@angular/router";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {Individual} from "../../shared/individuals/individual";
import {SitesService} from "../../shared/sites/sites.service";
import {ModalDialogService, ModalDialogOptions} from "@nativescript/angular";
import {IndividualInfoModal} from "./individual-info/individual-info-modal.component";
import {SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {NewIndividualModal} from "./new-individual/new-individual-modal.component";
import {SyncService} from "../../shared/sync/sync.service";

// import {ImageSource} from "@nativescript/core/image-source";
//import {GC} from "@nativescript/core/utils";
// var imageSource = require("image-source");
var fs = require("@nativescript/core/file-system");
// var imageModule = require("ui/image");
const platform = require("@nativescript/core/platform");
import {icons} from "../icons";
import {Page} from "@nativescript/core/ui/page";
import { NetworksService } from "../../shared/networks/networks.service";
let utilsModule = require("@nativescript/core/utils");

@Component({
    moduleId: module.id,
    selector: "individuals",
    templateUrl: "./individuals.html",
    styleUrls: ["./individuals-common.scss"],
    providers: []
})
export class IndividualsComponent implements OnInit {

    constructor(private _speciesService: SpeciesService,
                public _networksService: NetworksService,
                public _sitesService: SitesService,
                private _individualsService: IndividualsService,
                private _syncService: SyncService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _router: Router,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    backwardIcon = icons.backwardIcon;
    leafIcon = icons.leafIcon;
    eyeIcon = icons.eyeIcon;
    notificationIcon = icons.notificationIcon;
    lightbulbIcon = icons.lightbulbIcon;

    isLoading = false;
    listLoaded = false;
    pageEnter = false;
    pageExit = false;

    public individuals: Individual[];

    goToObserve() {
        this._router.navigate(["/observe"]);
    }

    goToSites() {
        this._router.navigate(["/sites"]);
    }

    refreshSpecies() {
        this.ngOnInit();
    }

    getPageHeader() {
        return this._sitesService.selectedSite ? `${this._sitesService.selectedSite.station_name} Plants & Animals` : ``;
    }

    getIndividualImage(individual: Individual) {
        return this._individualsService.getIndividualImage(individual);
    }

    async loadIndividuals() {
        await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        this.individuals = this._individualsService.individuals.filter(ind => ind.active === 1);
        this.isLoading = false;
        this.listLoaded = true;
    }

    public popupIndividualInfo(individual: Individual) {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                individual: individual,
                individualName: individual.individual_userstr,
                siteName: individual.site.station_name,
                patch: individual.patch,
                gender: individual.gender,
                speciesImage: individual.site.file_url},
            fullscreen: true
        };

        this.modalService.showModal(IndividualInfoModal, options).then((dialogResult: string) => {
        });
    }

    permissionToAddIndividual() {
        return this._networksService.isAdmin();
    }

    async addIndividual() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                currentSite: this._sitesService.selectedSite,
                currentSiteIndividuals: this._individualsService.individuals //active and inactive
            },
            fullscreen: true
        };

        this.modalService.showModal(NewIndividualModal, options).then(async (newIndividual: Individual) => {
            if (newIndividual) {
                let inactiveIndividuals = (await this._individualsService.getIndividualsFromDatabase([this._sitesService.selectedSite])).filter(ind => ind.active === 0);
                if (inactiveIndividuals.map(ind => ind.individual_userstr).includes(newIndividual.individual_userstr)) {
                    //todo increment number on name
                    await this._individualsService.activateIndividual(newIndividual);
                } else {
                    await this._individualsService.insertIntoDatabase(newIndividual);
                }
                await this._syncService.syncIndividuals();
                this.loadIndividuals();
            }
        })
    }

    openBrowser() {
        utilsModule.openUrl("learning.usanpn.org");
    }

    showList = false;
    ngOnInit() {
        setTimeout(() => {
            this.showList = true;
        }, 2);
        this.isLoading = true;
        this.listLoaded = false;
        this.pageEnter = true;
        this.pageExit = false;
        console.log("in individuals ngOnInit");
        this.individuals = [];
        this.loadIndividuals();
    }
}