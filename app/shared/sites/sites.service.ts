import {Site} from "./site";
import {Person} from "../people/person";
import {Network} from "../networks/network";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, of, from, throwError} from "rxjs";
import {SyncableTableService} from "../syncable-table-service";
import {OauthService} from "../oauth/oauth.service";
import {PeopleService} from "../people/people.service";
import { NetworksService } from "../networks/networks.service";
import { SitesPipe } from "../../pages/sites/sites.pipe";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { IndividualsService } from "../individuals/individuals.service";
import { HttpClient } from "@angular/common/http";
const applicationSettings = require("@nativescript/core/application-settings");
import config from '../../configuration.js';


@Injectable()
export class SitesService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _peopleService: PeopleService,
                public _oauthService: OauthService,
                public _networkService: NetworksService,
                public _individualsService: IndividualsService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('station_id', 'integer');
        this.sqLiteTypes.set('observer_id', 'integer');
        this.sqLiteTypes.set('station_name', 'text');
        this.sqLiteTypes.set('latitude', 'numeric');
        this.sqLiteTypes.set('longitude', 'numeric');
        this.sqLiteTypes.set('lat_lon_datum', 'text');
        this.sqLiteTypes.set('elevation_m', 'numeric');
        this.sqLiteTypes.set('comment', 'text');
        this.sqLiteTypes.set('street_address', 'text');
        this.sqLiteTypes.set('city', 'text');
        this.sqLiteTypes.set('state', 'text');
        this.sqLiteTypes.set('country', 'text');
        this.sqLiteTypes.set('postal_code', 'text');
        this.sqLiteTypes.set('elevation_source', 'text');
        this.sqLiteTypes.set('lat_lon_source', 'text');
        this.sqLiteTypes.set('development', 'text');
        this.sqLiteTypes.set('slope_type', 'text');
        this.sqLiteTypes.set('slope_location', 'text');
        this.sqLiteTypes.set('slope_faces', 'text');
        this.sqLiteTypes.set('active', 'numeric');
        this.sqLiteTypes.set('elevation_user_m', 'numeric');
        this.sqLiteTypes.set('elevation_calc_m', 'numeric');
        this.sqLiteTypes.set('elevation_calc_source', 'text');
        this.sqLiteTypes.set('latitude_user', 'numeric');
        this.sqLiteTypes.set('longitude_user', 'numeric');
        this.sqLiteTypes.set('load_key', 'text');
        this.sqLiteTypes.set('land_cover', 'text');
        this.sqLiteTypes.set('forest_type', 'text');
        this.sqLiteTypes.set('bodies_of_water', 'numeric');
        this.sqLiteTypes.set('bodies_of_water_units', 'numeric');
        this.sqLiteTypes.set('area_of_site', 'numeric');
        this.sqLiteTypes.set('area_of_site_units_id', 'numeric');
        this.sqLiteTypes.set('distance_nearest_road', 'numeric');
        this.sqLiteTypes.set('distance_nearest_road_units_id', 'numeric');
        this.sqLiteTypes.set('create_date', 'text');
        this.sqLiteTypes.set('public', 'integer');
        this.sqLiteTypes.set('has_cats', 'integer');
        this.sqLiteTypes.set('has_dogs', 'integer');
        this.sqLiteTypes.set('has_other_domestic', 'integer');
        this.sqLiteTypes.set('other_domestic', 'text');
        this.sqLiteTypes.set('has_garden', 'integer');
        this.sqLiteTypes.set('has_feeder', 'integer');
        this.sqLiteTypes.set('has_nestbox', 'integer');
        this.sqLiteTypes.set('has_fruit', 'integer');
        this.sqLiteTypes.set('has_birdbath', 'integer');
        this.sqLiteTypes.set('has_other_features', 'integer');
        this.sqLiteTypes.set('other_features', 'text');
        this.sqLiteTypes.set('gmt_difference', 'numeric');
        this.sqLiteTypes.set('short_latitude', 'numeric');
        this.sqLiteTypes.set('short_longitude', 'numeric');
        this.sqLiteTypes.set('file_url', 'text');
        this.sqLiteTypes.set('network_id', 'integer');
        this.sqLiteTypes.set('deleted', 'integer');
        this.sqLiteTypes.set('person_id', 'integer');
    }

    serviceName = 'stations';
    tableName = 'stations';
    primaryKey = 'station_id';

    serverTableColumns = [
        'station_id',
        'observer_id',
        'station_name',
        'latitude',
        'longitude',
        'lat_lon_datum',
        'elevation_m',
        'comment',
        'street_address',
        'city',
        'state',
        'country',
        'postal_code',
        'elevation_source',
        'lat_lon_source',
        'development',
        'slope_type',
        'slope_location',
        'slope_faces',
        'active',
        'elevation_user_m',
        'elevation_calc_m',
        'elevation_calc_source',
        'latitude_user',
        'longitude_user',
        'load_key',
        'land_cover',
        'forest_type',
        'bodies_of_water',
        'bodies_of_water_units',
        'area_of_site',
        'area_of_site_units_id',
        'distance_nearest_road',
        'distance_nearest_road_units_id',
        'create_date',
        'public',
        'has_dogs',
        'has_cats',
        'has_other_domestic',
        'other_domestic',
        'has_garden',
        'has_feeder',
        'has_nestbox',
        'has_fruit',
        'has_birdbath',
        'has_other_features',
        'gmt_difference',
        'short_latitude',
        'short_longitude',
        'file_url',
        'network_id'
    ];

    additionalTableColumns: string[] = [
        'person_id',
        'deleted'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public personalSites: Site[] = [];
    public groupSites: Site[] = [];
    public sites: Site[] = []; // personal and group sites sorted by station_name
    public _selectedSite: Site;


    // setter and getter used here to accommodate retaining the selectedSite in the localstore when app is closed
    set selectedSite(selectedSite: Site) {
        for(let site of this.sites) {
            (selectedSite && site.station_id === selectedSite.station_id) ? site.selected = true : site.selected = false;
        }
        this._selectedSite = selectedSite;
        if(selectedSite) {
            applicationSettings.setString('selectedSiteID', selectedSite.station_id.toString());
        } else {
            applicationSettings.remove('selectedSiteID');
        }
    }

    get selectedSite() {
        // first try and grab the site matching the station_id saved in the local store
        let storedSiteId = null;
        try {
            storedSiteId = +applicationSettings.getString('selectedSiteID');
        } catch(err) {
            applicationSettings.getNumber('selectedSiteID');
        }
        for(let site of this.sites) {
            if (site.station_id === storedSiteId) {
                this._selectedSite = site;
                site.selected = true;
                return site;
            }
        }
        // otherwise attempt to select the first site if there are any sites (in the selected group)
        if (this.sites.length > 0) {
            for(let site of this.sites) {
                if ((site.network_id === this._networkService.selectedNetwork.network_id)
                || (!site.network_id && this._networkService.selectedNetwork.network_id === -1)) {
                    this._selectedSite = site;
                    site.selected = true;
                    return site;
                }
            }
        } else {
            return null;
        }
    }

    getSitesForPersonFromDatabase(person: Person) {
        let query = `SELECT * FROM ${this.tableName} WHERE person_id = ${person.person_id} AND deleted != 1 ORDER BY network_id, station_name`;
        console.log(query);
        // return this._databaseService.runQuery(this._databaseService.db, query, true);
        return from(this.getDatabase().all(query)).pipe(
            map(res => {
                return <Site[]> res;
            }),
            catchError(err => {
                console.log('Error in getSitesForPersonFromDatabase: ' + err);
                return throwError(err);
            })
        ).toPromise();
    }

    getSitesForSelectedNetwork() {
        let sitesInSelectedNetwork = new SitesPipe().transform(this.sites, this._networkService.selectedNetwork);
        return sitesInSelectedNetwork;
    }

    async loadSites(person: Person) {
        let sites: Site[] = await this.getSitesForPersonFromDatabase(person);
        this.sites = [];
        this.personalSites = [];
        this.groupSites = [];

        for (let site of sites) {
            if (site.network_id) {
                this.groupSites.push(site);
            } else {
                this.personalSites.push(site);
            }
        }

        this.sites = this.personalSites.concat(this.groupSites).sort(function(a: Site, b: Site) {
            if(a.station_name.toLowerCase() < b.station_name.toLowerCase())
                return -1;
            else if(a.station_name.toLowerCase() > b.station_name.toLowerCase())
                return 1;
            else
                return 0;
        });
    }

    async loadNewSite(person: Person, site: Site) {
        await this.loadSites(person);

        for (var s of this.sites) {
            if(s.station_id === site.station_id) {
                s.selected = true;
                this.selectedSite = s;
            } else {
                s.selected = false;
            }
        }
    }

    async loadSitesForPerson(person: Person, group: Network) {
        await this.loadSites(person);
    }

    selectFirstSiteInGroup(group: Network) {
        this.selectedSite = null;
        for (let site of this.sites) {
            if (site.network_id === group.network_id || (group.network_id === -1 && site.network_id === null)) {
                this.selectedSite = site;
                break;
            }
        }
    }

    geoCode(street, city, state) {
        let apiKey = config.googleapikey;
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(street)},${encodeURI(city)},+${encodeURI(state)}&key=${apiKey}`;
        console.log(`looking up ${url}`);
        return this.http.get(url)
        .pipe(catchError(err => {
            console.log('geoCodeError');
            console.log(JSON.stringify(err));
            this._databaseService.logGeoCodeError(`ERROR: ${JSON.stringify(err)}}`);
            return throwError(err);
        }))
    }

    reverseGeoCode(lat, lng) {
        let apiKey = config.googleapikey;
        let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        return this.http.get(url)
        .pipe(catchError(err => {
            console.log('geoCodeError');
            console.log(JSON.stringify(err));
            this._databaseService.logGeoCodeError(`ERROR: ${JSON.stringify(err)}}`);
            return throwError(err);
        }));
    }

    async siteNameAlreadyExists(stationName: string, selectedGroup: Network, selectedPerson: Person) {
        const serviceName = `${this.serviceName}?station_name=${encodeURIComponent(stationName)}`;
        const getUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + serviceName;
        console.log(`retrieving ${getUrl}`);
        let serverStations = await this.http.get(getUrl)
        .pipe(catchError(err => {
            console.log(JSON.stringify(err));
            this._databaseService.logSyncError(`ERROR: ${JSON.stringify(err)}}`);
            return [];
        }))
        .toPromise();

        return serverStations.some((site: Site) => {
            return ((selectedGroup.name === 'Personal Sites' && selectedPerson.person_id === site.observer_id)
                || (site.network_id && site.network_id === selectedGroup.network_id));
        });
    }

    addSite (site: Site) {
        const postUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + `${this.serviceName}`;

        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);
        let payload = [{insert_object: site}];

        console.log(JSON.stringify(payload));
        this._databaseService.logSyncInfo(`POST: ${postUrl + JSON.stringify(payload)}`);

        return this.http.post(postUrl, payload, options)
        .pipe(catchError(err => {
            console.log(JSON.stringify(err));
            this._databaseService.logSyncError(`ERROR: could not add site POST: ${postUrl + JSON.stringify(payload) + JSON.stringify(err)}}`);
            return throwError(err);
        }))
        .toPromise();
    }

    addNetworkStation (networkStation) {
        const postUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + `network_stations`;

        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);
        let payload = [{insert_object: networkStation}];

        console.log(JSON.stringify(payload));
        this._databaseService.logSyncInfo(`POST: ${postUrl + JSON.stringify(payload)}`);

        return this.http.post(postUrl, payload, options)
        .pipe(catchError(err => {
            console.log(JSON.stringify(err));
            this._databaseService.logSyncError(`ERROR: could not add network-station POST: ${postUrl + JSON.stringify(payload) + JSON.stringify(err)}}`);
            return throwError(err);
        }))
        .toPromise();
    }

    async deleteSiteFromDatase(station_id) {
        let query = `UPDATE ${this.tableName} SET deleted = 1 WHERE station_id = ${station_id}`;
        return this._databaseService.runQuery(this.getDatabase(), query);
    }

    async syncTable<Site>(parents: any, parentJoinColumn: string, serverJoinColumn: string, otherParents?: any, otherParentJoinColumn?: string, otherServerJoinColumn?: string) {

        // these are network sites
        let otherServerObjects: Site[] = (otherParents && otherParents.length > 0) ? await this.getFromServerForParents<Site>(otherParents, otherParentJoinColumn, otherServerJoinColumn) : [];
        // these are personal sites
        let serverObjects: Site[] = (parents && parents.length > 0) ? await this.getFromServerForParents<Site>(parents, parentJoinColumn, serverJoinColumn) : [];
        //filter removes duplicates (site is both network and has matching observer_id)
        serverObjects = serverObjects.concat(otherServerObjects.filter((networkSite:Site) => networkSite['observer_id'] != parents[0].person_id));

        for (var object of serverObjects) {
            object['person_id'] = parents[0].person_id;
        }

        //let dbObjects: Site[] = await this.getFromDatabase<Site>();
        let parent_ids = parents.map((parent) => parent[parentJoinColumn]).join();
        let dbObjects: Site[] = await this.getFromDatabaseWhere<Site>(parentJoinColumn, parent_ids);

        //remove sites from database that weren't returned from the server
        await this.startTransaction();
        let deletedSite = false;
        for(var dbObject of dbObjects.filter(s => s['deleted'] != 1)) {
            if (!serverObjects.some((serverObject) => serverObject[this.primaryKey] == dbObject[this.primaryKey])) {
                let result = await this.deleteSiteFromDatase(dbObject[this.primaryKey]);
                await this._individualsService.inactivateIndividualsForSite(dbObject[this.primaryKey]);
                deletedSite = true;
            }
        }
        await this.commitTransaction();

        // make sure the model reflects the deleted site
        if(deletedSite) {
            await this.loadSites(this._peopleService.selectedPerson);
            await this._individualsService.loadIndividualsForSite(this.selectedSite);
        }

        //insert or update each server site in the database
        await this.startTransaction();
        for (var serverObject of serverObjects) {
            if (dbObjects.some((dbObject) => serverObject[this.primaryKey] == dbObject[this.primaryKey])) {
                let result = await this.updateInDatabase(serverObject);
            }
            else {
                let result = await this.insertIntoDatabase(serverObject);
            }
        }
        await this.commitTransaction();

        return serverObjects;
    }

}
