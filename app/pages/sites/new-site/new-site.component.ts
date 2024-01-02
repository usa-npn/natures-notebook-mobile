import {Component, ElementRef, OnInit, AfterViewInit, ViewChild, ViewContainerRef} from "@angular/core";
import {SitesService} from "../../../shared/sites/sites.service";
var http = require("http");
import {Site} from "../../../shared/sites/site";
import {ActivatedRoute, Router} from "@angular/router";
import {State, states} from "../states";
import {registerElement} from "@nativescript/angular";
import * as geolocation from '@nativescript/geolocation';
import {ModalDialogOptions, ModalDialogService} from "@nativescript/angular";
import {PickerModal} from "../../modals/picker-modal/picker-modal.component";
import {Subject} from "rxjs";
import {BehaviorSubject} from "rxjs";
import { distinctUntilChanged, debounceTime } from "rxjs/operators";
import {icons} from "../../icons";
import {NetworkMonitorService} from "../../../shared/network-monitor/network-monitor.service";
import {PeopleService} from "../../../shared/people/people.service";
import {NetworksService} from "../../../shared/networks/networks.service";
import {DatabaseService} from "../../../shared/database/database.service";
//var mapsModule = require("nativescript-google-maps-sdk");
import {MapView, Marker, Position} from 'nativescript-google-maps-sdk';
import { Page } from "@nativescript/core/ui/page";

// Important - must register MapView plugin in order to use in Angular templates
registerElement("MapView", () => MapView);

@Component({
    moduleId: module.id,
    selector: "newSite",
    templateUrl: "./new-site.html",
    styleUrls: ["../sites-common.scss"]
})
export class NewSiteComponent implements OnInit, AfterViewInit {

    public dropdownIcon = icons.dropdownIcon;
    public siteName = "";
    public latitude =  null;
    public longitude = null;
    public zoomLvl = 1;
    public bearing = 0;
    public tilt = 0;
    public padding = [40, 40, 40, 40];
    public savingNewSite: boolean = false;
    public isLoading: boolean = true;
    public marker = new Marker();
    public geoStatus: string = 'coordinates were found!';
    public validAddress: boolean = false;
    public geoCodeServiceError: boolean = false;
    public states: State[] = [];
    public state: State;
    public streetNumber = "";
    public route = "";
    public thecity: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    public streetAddress: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    public activeTab = "map";

    //@ViewChild("MapView") mapView: ElementRef;
    mapView: MapView;

    constructor(private _sitesService: SitesService,
                private modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _router: Router,
                private _route: ActivatedRoute,
                private _networkMonitorService: NetworkMonitorService,
                private _peopleService: PeopleService,
                private _networkService: NetworksService,
                private _databaseService: DatabaseService,
                private page: Page) {
                    page.actionBarHidden = true;
    }

    async setLocationFromGeoLocation() {
        try {
            let loc = await geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 90000, timeout: 90000});
            this.latitude = Number(loc.latitude);
            this.longitude = Number(loc.longitude);
            this.zoomLvl = 12;
            console.log("Current location is: " + JSON.stringify(loc));
        } catch(e) {
            console.log("Error: " + e.message);
        }
    }

    onMapReady = async (args) => {
        this.mapView = args.object;
        this.mapView.settings.mapToolbarEnabled = false;
        this.mapView.settings.zoomControlsEnabled = true;

        // either get geolocation to add marker or center zoomed out map at center of usa
        geolocation.enableLocationRequest().then(async () => {
            await this.setLocationFromGeoLocation();
            this.zoomLvl = 12;
            this.mapView.zoom = this.zoomLvl;
            this.addMarker();
        }, () => {
            this.centerGoogleMap();
        });
    };

    centerGoogleMap() {
        this.mapView.latitude = 39.8
        this.mapView.longitude = -98.5;
        this.zoomLvl = 1;
    }

    // adds a new marker or updates the current markers position
    onCoordinateTapped = (args) => {
        if (this.savingNewSite)
            return;
        console.log("Coordinate Tapped, Lat: " + args.position.latitude + ", Lon: " + args.position.longitude);

        this.longitude = Number(args.position.longitude.toFixed(4));
        this.latitude = Number(args.position.latitude.toFixed(4));

        this.mapView.longitude = this.longitude;
        this.mapView.latitude = this.latitude;

        if (this.marker.position.latitude == 0 && this.marker.position.longitude == 0) {
            this.addMarker();
        } else {
            this.marker.position = Position.positionFromLatLng(args.position.latitude, args.position.longitude);
        }
    };

    addMarker() {
        this.mapView.latitude = this.latitude;
        this.mapView.longitude = this.longitude;

        this.marker.position = Position.positionFromLatLng(this.latitude, this.longitude);
        // this.marker.title = this.siteName;
        // this.marker.snippet = `(${this.longitude.toFixed(4)}, ${this.latitude.toFixed(4)})`;
        // this.marker.userData = { index : 1};
        
        this.mapView.addMarker(this.marker);
    }

    getCoordinatesText() {
        return `Coordinates: ${this.latitude}, ${this.longitude}`
    }

    cancelNewSite() {
        this._router.navigate(["/sites"])
    }

    public async saveNewSite() {
        if (!this._networkMonitorService.connected) {
            alert("You need to connect your device to the internet to save your site.");
            return;
        } else if(!this.latitude || !this.longitude) {
            alert("You must select your site's location by tapping on the map or entering a valid address.");
            return;
        } else {

            try {
                this.savingNewSite = true;
                let site = new Site();
                site.station_name = this.siteName;
                site.latitude = this.latitude;
                site.longitude = this.longitude;
                site.observer_id = this._peopleService.selectedPerson.person_id;

                if (this._networkService.selectedNetwork && this._networkService.selectedNetwork.name != "Personal Sites") {
                    site.network_id = this._networkService.selectedNetwork.network_id
                }

                // send site to server to be added to remote database
                let serverResult = await this._sitesService.addSite(site);

                console.log('server result is');

                let postedSite = serverResult[0]['insert_object'];

                //set the person_id column before insertion into the localdatabase
                postedSite.person_id = this._peopleService.selectedPerson.person_id;
                //possibly set the network_id and send off a network station to server
                if (this._networkService.selectedNetwork && this._networkService.selectedNetwork.name != "Personal Sites") {
                    postedSite.network_id = this._networkService.selectedNetwork.network_id;
                    // send network station to remote server
                    let networkStation = {
                        "network_id": this._networkService.selectedNetwork.network_id,
                        "station_id": postedSite.station_id
                    };
                    let networkStationResult = await this._sitesService.addNetworkStation(networkStation);
                }

                console.log(JSON.stringify(serverResult));

                // add the station returned from the server to the local database
                let databaseResult = await this._sitesService.insertIntoDatabase(postedSite);

                // reload the person's sites from the local database and select the newly added site
                await this._sitesService.loadNewSite(this._peopleService.selectedPerson, postedSite);

                this.savingNewSite = false;
                this._router.navigate(["/sites"]);

            } catch(error) {
                alert("There was an error adding the site.");
                console.log(error);
                await this._databaseService.log('NEW SITE', "ERROR", error);
                return;
            }
        }
    }

    // attempts to convert address to lat / long
    callGeoCoder() {
        this.geoStatus = "Searching for address...";
        this._sitesService.geoCode(this.streetAddress.value, this.thecity.value, this.state ? this.state.state_code : '').subscribe(
            geo => {
                this.geoCodeServiceError = false;
                console.log(JSON.stringify(geo));
                if (geo['results'].length > 0) {

                    //make sure the incoming city and state matches (geocoder sometimes returns results even if some query params don't match)
                    let queryMatches = true;
                    geo['results'][0].address_components.forEach(ac => {
                        if(ac.types.includes('administrative_area_level_1')) {
                            if (this.state.state_code != ac.short_name) {
                                this.geoStatus = "Address wasn't found!";
                                this.validAddress = false;
                                queryMatches = false;
                                return;
                            }
                        } else if(ac.types.includes('locality')) {
                            if(!this.thecity.value || !this.streetAddress.value || this.thecity.value.toLowerCase() != ac.short_name.toLowerCase()) {
                                this.geoStatus = "Address wasn't found!";
                                this.validAddress = false;
                                queryMatches = false;
                                return;
                            }
                        }
                    });
                    if (!queryMatches) {
                        return;
                    }

                    this.latitude = geo['results'][0].geometry.location.lat;
                    this.longitude = geo['results'][0].geometry.location.lng;

                    if (this.marker.position.latitude == 0 && this.marker.position.longitude == 0) {
                        this.addMarker();
                    } else {
                        this.marker.position = Position.positionFromLatLng(this.latitude, this.longitude);
                    }

                    this.validAddress = true;
                    this.geoStatus = "Address was found! Coordinates are up to date."
                    this.zoomLvl = 12;
                    this.mapView.longitude = this.longitude;
                    this.mapView.latitude = this.latitude;
                    this.mapView.zoom = this.zoomLvl;
                } else {
                    console.log("location wasn't found");
                    this.geoStatus = "Address wasn't found!";
                    this.validAddress = false;
                }
            },
            error => {
                this.geoCodeServiceError = true;
                this._databaseService.log('GEOCODER', "ERROR", error);
                this.geoStatus = "There was an error searching for the address!";
            }
        );
    }

    openMapTab() {
        this.activeTab = "map";
        this.callGeoCoder();
    }

    openAddressTab() {
        this.activeTab = "address";
        this._sitesService.reverseGeoCode(this.latitude, this.longitude).subscribe(
            geo => {
                this.geoCodeServiceError = false;
                console.log("***************RESULTS ARE IN!!!!*********************");
                console.log(JSON.stringify(geo['results'][0]));
                console.log("9999999999999999999999999999999999999999999999999999999");
                if (geo['results'].length > 0) {
                    geo['results'][0].address_components.forEach(ac => {
                        if (ac.types.includes('street_number')) {
                            this.streetNumber = ac.short_name;
                        } else if(ac.types.includes('route')) {
                            this.route = ac.short_name;
                        } else if(ac.types.includes('locality')) {
                            this.thecity.next(ac.short_name);
                        }
                        else if(ac.types.includes('administrative_area_level_1')) {
                            this.state = this.states.find(s => { return s.state_code === ac.short_name});
                        }
                    });
                    this.streetAddress.next(this.streetNumber + " " + this.route);
                } else {
                    console.log("no location at coordinates");
                    this.validAddress = false;
                }

            },
            error => { this.geoCodeServiceError = true; }
        );
    }

    async popupStatePicker() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                items: this.states,
                selectedItem: this.state,
                title: "Choose a State.",
                pickerType: "state"
            },
            fullscreen: true
        };

        this.modalService.showModal(PickerModal, options).then((selectedState) => {
            this.state = selectedState;
            this.callGeoCoder();
        })
    }

    public addressChanged() {
       this.callGeoCoder();
    }

    ngOnInit() {
        this.siteName = this._route.snapshot.params['siteName'];
        this.geoCodeServiceError = false;
        this.states = states;
        this.state = this.states[0];
        console.log("in new site onInit");

        this.thecity.pipe(
            debounceTime(2000), 
            distinctUntilChanged()
        ).subscribe((data) => {
            this.addressChanged();
        });
        this.streetAddress.pipe(
            debounceTime(2000),
            distinctUntilChanged()
        ).subscribe((data) => {
            this.addressChanged();
        });
        this.thecity.subscribe(data => console.log(data));
        this.callGeoCoder();
    }

    ngAfterViewInit() {
        //setTimeout(this.addMarker, 4000);
    }
}
