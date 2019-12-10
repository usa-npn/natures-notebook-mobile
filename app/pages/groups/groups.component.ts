import {Component, OnInit, ViewContainerRef, ChangeDetectorRef, AfterViewInit} from "@angular/core";
var http = require("http");
import {Router} from "@angular/router";
import {ModalDialogService, ModalDialogOptions} from "nativescript-angular";
import {NetworksService} from "../../shared/networks/networks.service";
import {Network} from "../../shared/networks/network";
import {SwipeGestureEventData} from "ui/gestures";
import {JoinGroupModal} from "./join-group/join-group-modal.component";
import {SitesService} from "../../shared/sites/sites.service";
import {NetworkMonitorService} from "../../shared/network-monitor/network-monitor.service";
import {icons} from "../icons";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import { Page } from "tns-core-modules/ui/page/page";
import { AlertModal } from "../modals/alert-modal/alert-modal.component";
let utilsModule = require("tns-core-modules/utils/utils");

@Component({
    moduleId: module.id,
    selector: "groups",
    templateUrl: "./groups.html",
    styleUrls: ["./groups-common.scss"]
})
export class GroupsComponent implements OnInit, AfterViewInit {

    constructor(private _networksService: NetworksService,
                private _sitesService: SitesService,
                private _networkMonitorService: NetworkMonitorService,
                private _observationGroupsService: ObservationGroupsService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private cdr: ChangeDetectorRef,
                private _router: Router,
                private page: Page
                ) {
        page.actionBarHidden = true;
    }

    groupIcon = icons.groupIcon;
    locationIcon = icons.locationIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;
    infoIcon = icons.infoIcon;
    lightbulbIcon = icons.lightbulbIcon;

    isLoading = false;
    public groups: Network[] = [];

    goToMySites() {
        // select the my sites radio
        for(let g of this.groups) {
            g.selected = false;
        }
        this.groups[0].selected = true;

        this._networksService.selectedNetwork = this._networksService.mySites;
        // this._sitesService.updateSelectedSite(this._networksService.selectedNetwork);
        this._router.navigate(["/sites"]);
    }

    popupNoGroupSiteModal(group) {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                showHeader: false,
                informationText: `As a member of ${group.name} all of your observations are automatically added to this group.`,
                showCancel: false
            },
            fullscreen: false
        };

        this.modalService.showModal(AlertModal, options).then(async (result) => {
            
        });
    }

    toggleGroup(group) {
        if (group.no_group_site == 1) {
            this.popupNoGroupSiteModal(group);
            // alert(`As a member of ${group.name} all of your observations are automatically added to this group.`);
            return;
        }
        if (!group.selected || !this._sitesService.sites) {
            for(let g of this.groups) {
                g.selected = false;
            }
            group.selected = true;
            this._networksService.selectedNetwork = group;
            this._sitesService.selectFirstSiteInGroup(this._networksService.selectedNetwork);
            this._observationGroupsService.resetDate();
        }
        this._router.navigate(["/sites"]);
    }

    async joinGroup() {
        if (!this._networkMonitorService.connected) {
            alert("You need to connect your device to the internet to join a group.");
        } else {
            let options: ModalDialogOptions = {
                viewContainerRef: this.viewContainerRef,
                context: {
                    groups: this.groups
                },
                fullscreen: true
            };

            this.modalService.showModal(JoinGroupModal, options).then(() => {
                console.log("left the join group modal");
                this.groups = this._networksService.networks;
                this._observationGroupsService.resetDate();
            });
        }
    }

    openBrowser() {
        utilsModule.openUrl("https://www.usanpn.org/nn/guidelines/group-sites");
    }

    ngOnInit() {
        this.isLoading = true;
        console.log("$$$ in groups ngOnInit");
        this.groups = this._networksService.networks;
        this.isLoading = false;
    }

    ngAfterViewInit() {
        if(this._networksService.showJoinGroupModal) {
            this._networksService.showJoinGroupModal = false;
            this.joinGroup();
        }
    }
}