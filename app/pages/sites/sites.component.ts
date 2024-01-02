import {Component, OnInit, ViewContainerRef, NgZone} from "@angular/core";
import {SitesService} from "../../shared/sites/sites.service";
var http = require("http");
import {Site} from "../../shared/sites/site";
import {Network} from "../../shared/networks/network";
import {Router} from "@angular/router";
import {ModalDialogService, ModalDialogOptions} from "@nativescript/angular";
import {SiteInfoModal} from "./site-info/site-info-modal.component";
import {PeopleService} from "../../shared/people/people.service";
import {SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {SiteCreationModal} from "./new-site/site-creation-modal.component";
import {NetworksService} from "../../shared/networks/networks.service";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {PickerModal} from "../modals/picker-modal/picker-modal.component";
import {icons} from "../icons";
import {SpeciesSpecificPhenophaseInformationService} from "../../shared/species/species-specific-phenophase-information.service";
import {Person} from "../../shared/people/person";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import {isNullOrUndefined} from "@nativescript/core/utils/types";
import {NetworkMonitorService} from "../../shared/network-monitor/network-monitor.service";
import {DatabaseService} from "../../shared/database/database.service";
import {Page} from "@nativescript/core/ui/page";
let utilsModule = require("@nativescript/core/utils");


@Component({
    moduleId: module.id,
    selector: "sites",
    templateUrl: "./sites.html",
    styleUrls: ["./sites-common.scss"]
})
export class SitesComponent implements OnInit {

    constructor(private _databaseService: DatabaseService,
                private _sitesService: SitesService,
                private _networksService: NetworksService,
                private _individualsService: IndividualsService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _sspiService: SpeciesSpecificPhenophaseInformationService,
                private _peopleService: PeopleService,
                private _observationGroupsService: ObservationGroupsService,
                private _router: Router,
                private _networkMonitorService: NetworkMonitorService,
                private page:Page
                ) {
        console.log('test');
        page.actionBarHidden = true;
        console.log('test');
    }

    cameraIcon = icons.cameraIcon;
    infoIcon = icons.infoIcon;
    locationIcon = icons.locationIcon;
    dropdownIcon = icons.dropdownIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;
    lightbulbIcon = icons.lightbulbIcon;
    leafIcon = icons.leafIcon;

    public sites: Site[] = [];
    public selectedGroup: Network;
    public selectedSite: Site;

    isLoading = false;

    // public selectedIndex = 1;
    public onchange(selectedi){
        console.log("selected index " + selectedi);
    }

    async toggleSite(site) {
        if (!site.selected) {
            this._observationGroupsService.resetDate();

            for(var s of this.sites) {
                s.selected = false;
            }
            site.selected = true;
            this._sitesService.selectedSite = site;
        }

        this._router.navigate(["/individuals"]);
    }

    public popupSiteInfo(site: Site) {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {  siteName:  site.station_name,
                        siteLongitude: site.longitude,
                        siteLatitude: site.latitude,
                        siteImage: site.file_url},
            fullscreen: true
        };

        this.modalService.showModal(SiteInfoModal, options).then((dialogResult: string) => {});
    }

    public popupSiteCreation() {
        // this._router.navigate([`/newSite/mytestsite`]);
        if (!this._networkMonitorService.connected) {
            alert("Your device must be connected to the internet to create a new site.");
        } else {
            let options: ModalDialogOptions = {
                viewContainerRef: this.viewContainerRef,
                context: {
                    selectedPerson: this._peopleService.selectedPerson,
                    selectedGroup: this._networksService.selectedNetwork},
                fullscreen: false
            };
            
            this.modalService.showModal(SiteCreationModal, options).then((dialogResult: string) => {
                if (dialogResult != "cancel" && !isNullOrUndefined(dialogResult))
                    // this._router.navigate([`/newSite/${dialogResult}`]);
                    // workaround for https://github.com/NativeScript/nativescript-angular/issues/1380
                    setTimeout(() => {
                        this._router.navigate([`/newSite/${dialogResult}`]);
                    }, 10);
            })
        }
    }

    permissionToAddSite() {
        return this._networksService.isAdmin();
    }

    goToIndividuals() {
        this._router.navigate(["/individuals"]);
    }

    openBrowser() {
        utilsModule.openUrl("https://www.usanpn.org/nn/guidelines");
    }

    // async initialLoad() {
    //     this._peopleService.people = await this._peopleService.getFromDatabase<Person>();
    //     this._peopleService.loadPeopleTokens();
    //     for (var person of this._peopleService.people) {
    //         person.selected = false;
    //     }

    //     await this._networksService.loadPersonToNetworksMap();
    //     await this._networksService.loadNetworksForPerson(this._peopleService.selectedPerson);
    //     await this._sitesService.loadSitesForPerson(this._peopleService.selectedPerson, this._networksService.selectedNetwork);
    //     await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
    //     this._peopleService.newAccountAdded = false;

    //     this.everyLoad();
    // }

    async everyLoad() {
        this.sites = this._sitesService.sites.filter(site => site.active === 1);
        this.selectedGroup = this._networksService.selectedNetwork;
        this.selectedSite = this._sitesService.selectedSite;
        await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        this.isLoading = false;
    }

    showList = false;
    ngOnInit() {
        setTimeout(() => {
            this.showList = true;
        }, 2);
        console.log("in sites ngOnInit");
        this.isLoading = true;
        this.everyLoad();
    }
}
