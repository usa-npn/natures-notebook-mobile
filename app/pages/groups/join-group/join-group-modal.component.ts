import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import {Page} from "@nativescript/core/ui/page";
import { Color } from '@nativescript/core/color';
import {GroupsPipe} from "./groups.pipe";
import {Network} from "../../../shared/networks/network";
import {NetworkHierarchy} from "../../../shared/networks/network-hierarchy";
import {Observable, Subject} from "rxjs";
import {NetworkPeopleService} from "../../../shared/networks/network-people.service";
import {PeopleService} from "../../../shared/people/people.service";
import {SyncService} from "../../../shared/sync/sync.service";
import {NetworkMonitorService} from "../../../shared/network-monitor/network-monitor.service";
import {NetworksService} from "../../../shared/networks/networks.service";
import {icons} from "../../icons";
import { distinctUntilChanged, debounceTime} from "rxjs/operators";
import { ConfigService } from '~/shared/config-service';

@Component({
    moduleId: module.id,
    selector: 'join-group-picker',
    templateUrl: "./join-group-modal.html",
    styleUrls: ["../groups-common.scss"],
    providers: [GroupsPipe]
})
export class JoinGroupModal implements OnInit, AfterViewInit {

    constructor(private params: ModalDialogParams,
                // private page:Page,
                private cdr: ChangeDetectorRef,
                private _networkPeopleService: NetworkPeopleService,
                private _networksService: NetworksService,
                private _syncService: SyncService,
                private _peopleService: PeopleService,
                private _networkMonitorService: NetworkMonitorService,
                private groupsPipe: GroupsPipe,
                private _configService: ConfigService) {
        // page.backgroundColor = new Color(50, 0, 0, 0);

        this.groups = params.context.groups;
        //this.groupsHierarchy = params.context.groupsHierarchy;

        this.alreadyJoinedGroupIds = this.groups.map(group => group.network_id);
    }

    public groups: Network[] = [];
    public alreadyJoinedGroupIds = [];
    public groupsHierarchy: NetworkHierarchy[];
    public searchPhrase: string = "";
    public selectedGroupHierarchy: NetworkHierarchy;
    public loadingNewGroup: boolean = false;

    public searchTerms = new Subject<string>();

    radioCheckedIcon = String.fromCharCode(0xea54);
    radioUncheckedIcon = String.fromCharCode(0xea56);
    dropdownIcon = String.fromCharCode(0xe9bf);
    dropupIcon = String.fromCharCode(0xe9c0);

    faPlusSquare = icons.faPlusSquare;
    faMinusSquare = icons.faMinusSquare;
    faCircleO = icons.faCircleO;
    faDotCircleO = icons.faDotCircleO;
    public searchIcon = icons.searchIcon;

    public expandHierarchy: boolean = false;

    public getIcon(groupHierarchy: NetworkHierarchy) {
        if (groupHierarchy.secondary_network || groupHierarchy.tertiary_network || groupHierarchy.quaternary_network) {
            if (this.expandHierarchy || groupHierarchy.showChildren) {
                return this.faMinusSquare;
            } else {
                return this.faPlusSquare;
            }
        } else {
            if (groupHierarchy.selected) {
                return this.faDotCircleO;
            } else {
                return this.faCircleO;
            }
        }

    }

    public toggleGroup(groupHierarchy: NetworkHierarchy) {
        if (groupHierarchy.secondary_network || groupHierarchy.tertiary_network || groupHierarchy.quaternary_network) {
            groupHierarchy.showChildren = !groupHierarchy.showChildren;
        } else {
            this.deselectAll();
            groupHierarchy.selected = true;
            this.selectedGroupHierarchy = groupHierarchy;
        }
        this.cdr.markForCheck();
    }

    deselectAll() {
       for (let group of this.groupsHierarchy) {
           group.selected = false;
           if(group.secondary_network) {
               for (let secondaryGroup of group.secondary_network) {
                   secondaryGroup.selected = false;
                   if(secondaryGroup.tertiary_network) {
                       for (let tertiaryGroup of secondaryGroup.tertiary_network) {
                           tertiaryGroup.selected = false;
                           if(tertiaryGroup.quaternary_network) {
                               for (let quaternaryGroup of tertiaryGroup.quaternary_network) {
                                   quaternaryGroup.selected = false;
                               }
                           }
                       }
                   }

               }
           }
       }
    }

    public searchTextChanged() {
        console.log('search text function');
        this.searchGroupsFilter();
        if (this.searchPhrase && this.searchPhrase !== '') {
            this.expandHierarchy = true;
        } else {
            this.expandHierarchy = false;
        }
        this.cdr.detectChanges();
    }

    searchGroupsFilter() {
        let searchString = this.searchPhrase.toLowerCase();
        this.groupsHierarchy.forEach(group => {
            let groupFound = false;
            group.hidden = true;
            group.showChildren = false;
            if (searchString === '') {
                group.hidden = false;
                group.showChildren = false;
            } else if (group.network_name.toLowerCase().includes(searchString)) {
                group.hidden = false;
                group.showChildren = true;
                groupFound = true;
            }
            if(group.secondary_network) {
                for (let secondaryNetwork of group.secondary_network) {
                    let secondaryGroupFound = false;
                    if (searchString === '') {
                        secondaryNetwork.hidden = false;
                        secondaryNetwork.showChildren = false;
                    } else {
                        secondaryNetwork.hidden = true;
                        secondaryNetwork.showChildren = false;
                        if(groupFound || secondaryNetwork.network_name.toLowerCase().includes(searchString) || (!searchString || searchString === '')) {
                            secondaryNetwork.hidden = false;
                            secondaryNetwork.showChildren = true;
                            group.hidden = false;
                            group.showChildren = true;
                            secondaryGroupFound = true;
                            // if(secondaryNetwork.network_name === 'Appalachian Trail Conservancy' || secondaryNetwork.network_name === 'Great Smoky Mountains NP') {
                            //     console.log(secondaryNetwork.network_name);
                            //     console.log(secondaryNetwork.hidden);
                            //     console.log(secondaryNetwork.showChildren);
                            // }
                        }
                    }
                    if(secondaryNetwork.tertiary_network) {
                        for (let tertiaryNetwork of secondaryNetwork.tertiary_network) {
                            let tertiaryGroupFound = false;
                            if (searchString === '') {
                                tertiaryNetwork.hidden = false;
                                tertiaryNetwork.showChildren = false;
                            } else {
                                tertiaryNetwork.hidden = true;
                                tertiaryNetwork.showChildren = false;
                                if(groupFound || secondaryGroupFound || tertiaryNetwork.network_name.toLowerCase().includes(searchString) || (!searchString || searchString === '')) {
                                    tertiaryNetwork.hidden = false;
                                    tertiaryNetwork.showChildren = true;
                                    secondaryNetwork.hidden = false;
                                    secondaryNetwork.showChildren = true;
                                    group.hidden = false;
                                    group.showChildren = true;
                                    tertiaryGroupFound = true;
                                }
                            }
                            if(tertiaryNetwork.quaternary_network) {
                                for (let quaternaryNetwork of tertiaryNetwork.quaternary_network) {
                                    if (searchString === '') {
                                        quaternaryNetwork.hidden = false;
                                        quaternaryNetwork.showChildren = false;
                                    } else {
                                        quaternaryNetwork.hidden = true;
                                        if (groupFound || secondaryGroupFound || tertiaryGroupFound || quaternaryNetwork.network_name.toLowerCase().includes(searchString) || (!searchString || searchString === '')) {
                                            tertiaryNetwork.hidden = false;
                                            tertiaryNetwork.showChildren = true;
                                            secondaryNetwork.hidden = false;
                                            secondaryNetwork.showChildren = true;
                                            group.hidden = false;
                                            group.showChildren = true;
                                        }
                                    }

                                }
                            }
                        }
                    }
                }
            }
        });
        this.cdr.markForCheck();
    }

    public showGroup(group: NetworkHierarchy) {
        if (this._configService.cloudMigrationFinished() && !(group.network_id > 0)) {
            return false;
        }
        return !group.hidden && !this.alreadyJoinedGroupIds.some((joinedGroupId) => joinedGroupId === group.network_id);
        
    }

    public async closeModal() {
        if (this.selectedGroupHierarchy) {
            if (!this._networkMonitorService.connected) {
                alert("You need to connect your device to the internet to join a Program.");
                return;
            } else {

                try {
                    // display to user that group data is downloading
                    this.loadingNewGroup = true;

                    // tell server to add network_person
                    let network_id = await this._networkPeopleService.joinNetwork(
                        this._peopleService.selectedPerson.person_id,
                        this.selectedGroupHierarchy.network_id);

                    // perform sync and reload model
                    if (network_id) {
                        await this._syncService.syncJoinedNetwork(network_id);
                    } else {
                        alert("There was an error joining the group.");
                        return;
                    }
                } catch(error) {
                    alert("There was an error joining the group.");
                    return;
                }
            }
        }
        this.params.closeCallback();
    }

    cancelModal() {
        this.params.closeCallback(null);
    }

    isLoading:boolean;
    ngOnInit() {
        this.isLoading = true;
        setTimeout(async () => {
            if(this._configService.cloudMigrationFinished()) {
                this.groupsHierarchy = await this._networksService.getLppsFromServer();
                this.groupsHierarchy.forEach(group => {
                    group.network_id = group.Network_ID;
                    group.network_name = group.Name;
                })
            } else {
                this.groupsHierarchy = await this._networksService.getHierarchyFromServer();
            }
            
            this.isLoading = false;
        }, 500);
        this.searchTerms
            .pipe(debounceTime(1000), distinctUntilChanged())
            .subscribe((data) => {
                this.searchTextChanged();
            });
    }

    ngAfterViewInit() {
    }
}