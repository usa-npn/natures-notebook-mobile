import {Component, OnInit, ChangeDetectorRef, NgZone} from "@angular/core";
import {PeopleService} from "../../shared/people/people.service";
import {Person} from "../../shared/people/person";
import {Router} from "@angular/router";
import { SwipeGestureEventData } from "ui/gestures";
import {OauthService} from "../../shared/oauth/oauth.service";
import {NetworksService} from "../../shared/networks/networks.service";
import {SitesService} from "../../shared/sites/sites.service";
import {RouterExtensions} from "nativescript-angular";
import {NetworkMonitorService} from "../../shared/network-monitor/network-monitor.service";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {icons} from "../icons";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import {Page} from "tns-core-modules/ui/page";
import * as application from "tns-core-modules/application";
import {AndroidActivityBackPressedEventData, AndroidApplication} from "tns-core-modules/application";

@Component({
    moduleId: module.id,
    selector: "accounts",
    templateUrl: "./accounts.html",
    styleUrls: ["./accounts-common.scss"],
})
export class AccountsComponent implements OnInit {

    constructor(
        private _peopleService: PeopleService,
        private _networksService: NetworksService,
        private _sitesService: SitesService,
        private _individualsService: IndividualsService,
        private _observationGroupsService: ObservationGroupsService,
        private _oauthService: OauthService,
        private _networkMonitorService: NetworkMonitorService,
        private _router: Router,
        private _routerExtensions: RouterExtensions,
        private cdr: ChangeDetectorRef,
        private _zone: NgZone,
        private page: Page
        ) {
        page.actionBarHidden = true;
    }

    public people: Person[] = [];
    userPlusIcon = icons.userPlusIcon;
    userCheckIcon = icons.userCheckIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;

    isLoading = false;

    createNewAccount() {
        if (this.people.length > 9) {
            alert("A maximum of 10 accounts can be registered on a device.")
        }
        else if(this._networkMonitorService.connected) {
            this._oauthService.loginType = "register";
            this._router.navigate(["/login"])
        } else {
            alert("You need to connect your device to the internet to create an account.");
        }
    }

    addExistingAccount() {
        if (this.people.length > 9) {
            alert("A maximum of 10 accounts can be registered on a device.")
        }
        else if(this._networkMonitorService.connected) {
            this._oauthService.loginType = "login";
            this._router.navigate(["/login"])
        } else {
            alert("You need to connect your device to the internet to add an account.");
        }
    }

    getAccountName() {
        if (!this._peopleService.selectedPerson)
            return '';
        return `Name: ${this._peopleService.selectedPerson.username}`;
    }

    getAccountEmail() {
        if (!this._peopleService.selectedPerson)
            return '';
        return `Email: ${this._peopleService.selectedPerson.email}`;
    }

    async togglePerson(person) {
        if (!person.selected || !this._networksService.networks || !this._sitesService.sites) {
            for(var p of this.people) {
                p.selected = false;
            }
            person.selected = true;
            this._peopleService.selectedPerson = person;
            await this.updateModelForSelectedPerson();
        }
        this._router.navigate(["/settings"]);
    }

    cancel() {
        this._router.navigate(["/settings"]);
    }

    async updateModelForSelectedPerson() {
        await this._networksService.loadNetworksForPerson(this._peopleService.selectedPerson);
        await this._sitesService.loadSitesForPerson(this._peopleService.selectedPerson, this._networksService.selectedNetwork);
        await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        this._observationGroupsService.resetDate();
    }

    async loadPeople() {
        this._peopleService.people = await this._peopleService.getFromDatabase<Person>();
        this._peopleService.loadPeopleTokens();
        this.people = this._peopleService.people;

        await this._networksService.loadPersonToNetworksMap();
        await this.updateModelForSelectedPerson();
        this._peopleService.newAccountAdded = false;
        this.isLoading = false;
    }

    ngOnInit() {
        this.isLoading = true;
        // setTimeout(() => {
            console.log("in accounts ngOnInit");
            if (this._peopleService.people.length === 0 || this._peopleService.newAccountAdded) {
                this.loadPeople();
            } else {
                this.people = this._peopleService.people;
                this.isLoading = false;
            }
        // }, 700);

        // application.android.removeEventListener(AndroidApplication.activityBackPressedEvent);
        // application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
        //     console.log('intercccepting android back button');
        //     data.cancel = true; // prevents default back button behavior
        //     //this._zone.run(() => this._router.navigate(["/settings"]));
        //     this._zone.run(() => this._routerExtensions.back());
        // });
    }
}