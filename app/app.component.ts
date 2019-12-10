import config from './configuration.js';
import {
    Component,
    OnInit,
    AfterViewInit,
    ViewChild,
    ElementRef,
    NgZone,
    ViewContainerRef} from '@angular/core';
import {
    Router,
    NavigationStart,
    Event as NavigationEvent,
    ActivatedRoute,
    Params,
    NavigationEnd} from '@angular/router';
import {DatabaseService} from './shared/database/database.service';
import {SyncService} from './shared/sync/sync.service';
import {OauthService} from './shared/oauth/oauth.service';
import {NetworkMonitorService} from './shared/network-monitor/network-monitor.service';
import * as application from "tns-core-modules/application";

import {NetworksService} from "./shared/networks/networks.service";
import * as platform from "platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {NetworkPeopleService} from "./shared/networks/network-people.service";
import {PeopleService} from "./shared/people/people.service";
import {SitesService} from "./shared/sites/sites.service";
import {IndividualsService} from "./shared/individuals/individuals.service";
import {ObservationsService} from "./shared/observations/observations.service";
import {ObservationGroupsService} from "./shared/observation-groups/observation-groups.service";
import {RouterExtensions, ModalDialogOptions, ModalDialogService} from "nativescript-angular";
import {isNullOrUndefined} from "tns-core-modules/utils/types";
import {AndroidActivityBackPressedEventData, AndroidApplication} from "tns-core-modules/application";
import { ModelService } from './shared/model/model.service';
import { SettingsService } from './shared/settings/settings.service';
import { ConfigService } from './shared/config-service';
import { AlertModal } from './pages/modals/alert-modal/alert-modal.component';
import { Page } from 'tns-core-modules/ui/page/page';
declare var GMSServices: any;
var Sqlite = require("nativescript-sqlite");
require( "nativescript-master-technology" );

@Component({
    moduleId: module.id,
    selector: "main",
    templateUrl: "app.component.html",
    styleUrls: ["./app-common.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {

    public intialLoad = true;
    activeRoute: string;
    activeTab: string = 'observe';
    @ViewChild("scrollMenu", {static: false}) scrollMenu: ElementRef;

    constructor(
        private _modelService: ModelService,
        private _dbService: DatabaseService,
        private _individualsService: IndividualsService,
        private _oauthService: OauthService,
        private _router: Router,
        private _routerExtensions: RouterExtensions,
        private _peopleService: PeopleService,
        private _networksService: NetworksService,
        private _networkPeopleService: NetworkPeopleService,
        private _networkMonitorService: NetworkMonitorService,
        private _sitesService: SitesService,
        private _observationsService: ObservationsService,
        private _observationGroupsService: ObservationGroupsService,
        private _settingsService: SettingsService,
        private _syncService: SyncService,
        private _configService: ConfigService,
        private _zone: NgZone,
        private viewContainerRef: ViewContainerRef,
        private modalService: ModalDialogService,
        private page: Page
    ) {
        this.page.actionBarHidden = true;
    }

    public menuItems = [
        { title: 'Groups', route: 'groups' },
        { title: 'Sites', route: 'sites' },
        { title: 'Plants & Animals', route: 'individuals' },
        { title: 'Observe', route: 'observe' },
        // { title: 'Sync', route: 'sync' },
        { title: 'Review', route: 'calendar' },
        { title: 'Settings', route: 'settings' }
    ];

    menuVisible() {
        return !isNullOrUndefined(this.activeRoute) 
        && !this.intialLoad
        && this.activeRoute != '/login'
        && this.activeRoute != '/accounts'
        && this.activeRoute != '/welcome'
        && this.activeRoute != '/syncing'
        && this.activeRoute != '/debug'
        && !this.activeRoute.startsWith('/newSite');
    }

    changePage(page) {
        this._routerExtensions.navigate([`/${page}`]);
    }

    loadExistingUserDatabase() {
        let databaseName = "debug.db";
        console.log(`using debug.db database`);
        if (!Sqlite.exists("debug.db")) {
            (Sqlite.copyDatabase("debug.db"));
        }
        return (new Sqlite(databaseName)).then(db => {
            this._dbService.db = db;
            this._dbService.db.resultType(Sqlite.RESULTSASOBJECT);
        });
    }

    initializeUserDatabase() {
        let t1 = new Date().getTime();
        let databaseName = "natures_notebook.db";
        return (new Sqlite(databaseName)).then(db => {
            this._dbService.db = db;
            this._dbService.db.resultType(Sqlite.RESULTSASOBJECT);
            this._dbService.createLogTable().then(() => {
                this._dbService.pruneLogs();
            });
            this._syncService.createTable();
            this._peopleService.createTable();
            this._networkPeopleService.createTable();
            this._networksService.createTable();
            this._sitesService.createTable();
            this._individualsService.createTable().then(() => {
                this._individualsService.createIndex('ssi__station_id_idx', 'station_id');
                this._observationsService.createIndex('ssi__timestamp_idx', 'timestamp');
                this._observationsService.createIndex('ssi__sync_status_idx', 'sync_status');
            });
            this._observationsService.createTable().then(() => {
                this._observationsService.createIndex('obs__observation_group_local_id_idx', 'observation_group_local_id');
                this._observationsService.createIndex('obs__timestamp_idx', 'timestamp');
                this._observationsService.createIndex('obs__sync_status_idx', 'sync_status');
                this._observationsService.createIndex('obs__individual_id_idx', 'individual_id');
                this._observationsService.createIndex('obs__individual_local_id_idx', 'individual_local_id');
                this._observationsService.createIndex('obs__observation_date_idx', 'observation_date');
            });
            this._observationGroupsService.createTable().then(() => {
                this._observationGroupsService.addColumn('notes', 'VARCHAR(255)');
                this._individualsService.createIndex('obsgr__timestamp_idx', 'timestamp');
                this._observationsService.createIndex('obsgr__sync_status_idx', 'sync_status');
            });
        }).then(() => {
            let t2 = new Date().getTime();
            console.log(`natures_notebook.db successfully created in ${t2 - t1} milliseconds.`)
        }).catch((error) => {
            console.log(`error initializing ${databaseName}: `, error)
        });
    }

    async initializeDatabases() {
        console.log("initializing databases");
        await this._configService.debug ? this.loadExistingUserDatabase() : this.initializeUserDatabase();
        if (this._networkMonitorService.connected) {
            console.log('updateAndLoadSystemDatabase');
            await this._dbService.updateAndLoadSystemDatabase();
        } else {
            console.log('loadSystemDatabase');
            await this._dbService.loadSystemDatabase();
        }
    }

    public modalOpen = false;
    public overRideAndroidBackButton() {
        if (platform.isAndroid) {
            application.android.removeEventListener(AndroidApplication.activityBackPressedEvent);
            application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
                console.log('intercepting android back button MAIN');
                data.cancel = true; // prevents default back button behavior
                // this._routerExtensions.back();
                // this._zone.run(() => {
                //     this._routerExtensions.back();
                // });
                // if(!this.modalOpen) {
                //     this._zone.run(() => {
                //         if(this._routerExtensions.canGoBack()) {
                //             this._routerExtensions.back();
                //         }
                //     });
                // }
                // this._modelService.androidBackButtonPressed.next('pressed');
            });
        }
    }

    public closeApp() {
        if(platform.isAndroid) {
            application.android.foregroundActivity.finish();
        } else {
            exit(0);
        }
    }

    popupWelcomeModal() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                headerText: "Welcome",
                informationText: "Nature's Notebook needs to download a database of species information with size 2.5MB, would you like to continue?"
            },
            fullscreen: false
        };

        this.modalService.showModal(AlertModal, options).then(async (result) => {
            if(result) {
                await this.downloadDbAndGoToLogin()
            } else {
                this.closeApp();
            }
        });
    }

    async downloadDbAndGoToLogin() {
        await this.initializeDatabases();
        if(this._networkMonitorService.connected) {
            if(this._networkMonitorService.connectionType == "wifi") {
                this._routerExtensions.navigate(["/login"], { clearHistory: true });
                this.activeRoute = "/login";
                this.intialLoad = false;
            } else {
                dialogs.confirm({
                    message: "Nature's Notebook needs to download data and currently doesn't detect a Wi-Fi connection, would you like to continue?", 
                    okButtonText: "Ok",
                    neutralButtonText: "Cancel",
                }).then(async (result) => {
                    if (result) {
                        this._routerExtensions.navigate(["/login"], { clearHistory: true });
                        this.activeRoute = "/login";
                        this.intialLoad = false;
                    } else {
                        this.closeApp();
                    }
                });
            }
        }
    }

    async ngOnInit() {

        if (platform.isIOS) {
            GMSServices.provideAPIKey(config.googleapikey);
        } 
        this.overRideAndroidBackButton();

        // // only reason initialize is called is because it's instant, monitorConnection has a delay before kicking off
        this._networkMonitorService.initialize(); //
        this._networkMonitorService.monitorConnection();

        if(!this._oauthService.oauthCompleted && !this._configService.debug) {
            if (platform.isIOS) {
                this.popupWelcomeModal();
            } else {
                this.downloadDbAndGoToLogin();
            }  
        } else {
            await this.initializeDatabases();
            this._routerExtensions.navigate(["/syncing"], { clearHistory: true });
            this.activeRoute = "/syncing";
            this.intialLoad = false;
            await this._modelService.loadModel(true);
            await this._syncService.syncAll();
            if((this._networksService._selectedNetwork && this._sitesService.groupSites.length == 1) 
                || this._sitesService.personalSites.length == 1) {
                this._routerExtensions.navigate(["/observe"], { clearHistory: true });
                this.activeRoute = "/observe";
                this.intialLoad = false;
            } else {
                this._routerExtensions.navigate(["/sites"], { clearHistory: true });
                this.activeRoute = "/sites";
                this.intialLoad = false;
            }

        }

    }

    ngAfterViewInit() {
        // listen to router to highlight selected menu item in top scrollbar
        this._router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.activeRoute = event.url;
            }
            if (event instanceof NavigationEnd) {
                let newRoute = this._router.url.replace('/', '');
                let selectedTabNumber = -1;
                this.menuItems.forEach((menuItem, index) => {
                    if (menuItem.route === newRoute) {
                        selectedTabNumber = index;
                        return;
                    }
                });

                if (this.scrollMenu)
                    this.scrollMenu.nativeElement.scrollToHorizontalOffset(selectedTabNumber*60-100, true);
                this.activeTab = newRoute;
            }
        });
    }
}