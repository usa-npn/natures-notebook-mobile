import {Injectable} from "@angular/core";
import { Observable } from 'rxjs';
import {Site} from "../sites/site";
import {Individual} from "../individuals/individual";
import {NetworkPerson} from "../networks/network-person";
import {Network} from "../networks/network";
import {Person} from "../people/person";
import {SitesService} from "../sites/sites.service";
import {NetworksService} from "../networks/networks.service";
import {PeopleService} from "../people/people.service";
import {IndividualsService} from "../individuals/individuals.service";
import {SpeciesService} from "../species/species.service";
import {NetworkPeopleService} from "../networks/network-people.service";
import {DatabaseService} from "../database/database.service";
import {ObservationsService} from "../observations/observations.service";
import {ObservationGroupsService} from "../observation-groups/observation-groups.service";
import {Observation} from "../observations/Observation";
import { SettingsService } from "../settings/settings.service";
import { NetworkMonitorService } from "../network-monitor/network-monitor.service";
import { ConfigService } from "../config-service";
import { ImageSource } from "tns-core-modules/image-source/image-source";
import { getImage } from "tns-core-modules/http";
import { keepAwake, allowSleepAgain } from "nativescript-insomnia";
import { ScistarterService } from "../scistarter/scistarter.service";
var imageSource = require("image-source");
var fs = require("file-system");
var applicationSettings = require("application-settings");

@Injectable()
export class SyncService {
    constructor(
        private _settingsService: SettingsService,
        private _speciesService: SpeciesService,
        private _sitesService: SitesService,
        private _networkMonitorService: NetworkMonitorService,
        private _networksService: NetworksService,
        private _networkPeopleService: NetworkPeopleService,
        private _peopleService: PeopleService,
        private _individualsService: IndividualsService,
        private _observationGroupsService: ObservationGroupsService,
        private _observationService: ObservationsService,
        private _databaseService: DatabaseService,
        private _configService: ConfigService,
        private _scistarterService: ScistarterService) {}


    public BASE_MEDIA_URL = "https://www.usanpn.org/files/shared/";
    public IMAGE_PATH = "images/species/";
    public MAP_PATH = "maps/";

    public currentlySyncing = "";
    public progressValue: number = 0;
    public syncing = false;
    public totalAccountsToSync = 1;
    public totalItemsPerAccountToSync = 7;
    public syncingAccount = "";

    public tableName = 'syncTable';

    // downloads individual and species images to device
    async syncIndividualImages(individuals: Individual[]) {
        let species = await this._speciesService.getSpeciesForIndividuals(individuals);
        var folder = fs.knownFolders.documents();

        for (var ind of individuals) {
            let src = ind.file_url;
            if (src && src != '') {
                // we just want the thumbnail version
                src = src.replace('.jpg', '_thumb.jpg');
                src = src.replace('.JPG', '_thumb.JPG');
                src = src.replace('.png', '_thumb.png');
                src = src.replace('.PNG', '_thumb.PNG');
                // make the local filename is the same as the server file name without the url path
                let fileName = src.split('/').pop();
                // console.log('downloading: ' + src);
                await getImage(src).then((res: ImageSource) => {
                // await imageSource.fromUrl(src).then((res) => {
                    var path = fs.path.join(folder.path, `${fileName}`);
                    res.saveToFile(path, "png");
                }, (error) => {
                    console.log(src);
                    console.log(error);
                });
            }
        }

        for(var sp of species) {
            let src = this.BASE_MEDIA_URL + this.IMAGE_PATH + sp.genus + '_' + sp.species;
            if (!fs.File.exists(fs.path.join(folder.path, `${sp.genus}_${sp.species}.png`))) {
                // console.log('downloading: ' + `${sp.genus}_${sp.species}.png`);
                await getImage(src).then((res: ImageSource) => {
                    var path = fs.path.join(folder.path, `${sp.genus}_${sp.species}.png`);
                    res.saveToFile(path, "png");
                }, (error) => {
                    console.log(`${sp.genus}_${sp.species}.png`);
                    console.log(error);
                });
            }
        }

    }

    async syncObservations() {
        try {
            if (this.syncing || this._configService.disableSyncing || !this._networkMonitorService.canSync()) {
                return;
            }
            this.syncing = true;

            // this is only called when the client has outgoing unsynced individuals
            // ie the user created a new individual that wasn't synced right away
            let lastSyncTimestamp = await this.getLastSyncTimeStamp(this._individualsService.tableName);
            if(applicationSettings.getBoolean('unsyncedIndividuals')) {
                console.log('there are unsynced individuals, syncing them now');
                this.currentlySyncing = "individuals";
                let individuals = await this._individualsService.syncIndividuals(lastSyncTimestamp);
                this.currentlySyncing = "individual images";
                await this.syncIndividualImages(individuals);
                applicationSettings.setBoolean('unsyncedIndividuals', false);
            }

            let t1 = new Date();

            lastSyncTimestamp = await this.getLastSyncTimeStamp(this._observationGroupsService.tableName);
            this.currentlySyncing = "site visit details";
            let observationGroups = await this._observationGroupsService.syncObservationGroups(lastSyncTimestamp);
            this.progressValue += 1;
            await this.updateLastSyncTimeStamp(this._observationGroupsService.tableName);
            
            lastSyncTimestamp = await this.getLastSyncTimeStamp(this._observationService.tableName);
            this.currentlySyncing = "observations";
            let observations = await this._observationService.syncObservations(lastSyncTimestamp);
            this.progressValue += 1;
            await this.updateLastSyncTimeStamp(this._observationService.tableName);
            this.syncing = false;

            let t2 = new Date();
            console.log('sync time: ' + (t2.getTime() - t1.getTime()));

            return true;
            
        } catch (error) {
            console.log(error);
            this.syncing = false;
            return error;
        }
    }

    async syncIndividuals() {
        if(!this._networkMonitorService.canSync()) {
            console.log('cant sync, setting unsyncedIndividuals to true');
            applicationSettings.setBoolean('unsyncedIndividuals', true);
            return false;
        }
        try {
            if (this.syncing) {
                return;
            }
            this.syncing = true;
            let lastSyncTimestamp = await this.getLastSyncTimeStamp(this._individualsService.tableName);
            this.currentlySyncing = "individuals";
            let individuals = await this._individualsService.syncIndividuals(lastSyncTimestamp);
            this.progressValue += 1;
            await this.updateLastSyncTimeStamp(this._individualsService.tableName);
            this.currentlySyncing = "individual images";
            await this.syncIndividualImages(individuals);
            this.progressValue += 1;
            this.syncing = false;
            applicationSettings.setBoolean('unsyncedIndividuals', false);
            return true;    
        } catch (error) {
            console.log(error);
            applicationSettings.setBoolean('unsyncedIndividuals', true);
            this.syncing = false;
            return error;
        }
    }

    async syncAll(force = false) {
        try {
            if (this.syncing || this._configService.disableSyncing || !this._networkMonitorService.canSync(force)) {
                this._databaseService.logSyncInfo('syncAll cancel');
                return;
            }
            this._databaseService.logSyncInfo('syncAll begin');
            await keepAwake();
            let t1 = new Date();

            this.syncing = true;
            // let lastSyncTimestamp = await this.getLastSyncTimeStamp();

            this.progressValue = 0;
            this.currentlySyncing = "accounts";

            let person = this._peopleService.selectedPerson;

            await this._scistarterService.getProfile();

            this.syncingAccount = person.username;
            console.log("person info");
            console.log(person.person_id);
            console.log(person.username);
            
            this.currentlySyncing = "network people";
            let networkPeople: NetworkPerson[] = await this._networkPeopleService.syncTable<NetworkPerson>([person], 'person_id', 'person_id');
            this.progressValue += 1;
            
            this.currentlySyncing = "networks";
            let networks: Network[] = await this._networksService.syncTable<Network>(networkPeople, 'network_id', 'network_id');
            this.progressValue += 1;
            
            this.currentlySyncing = "sites";
            let lastSyncTimestamp = await this.getLastSyncTimeStamp(this._sitesService.tableName);
            let sites: Site[] = await this._sitesService.syncTable<Site>([person], 'person_id', 'observer_id', networks, 'network_id', 'network_id');
            await this.updateLastSyncTimeStamp(this._sitesService.tableName);
            this.progressValue += 1;

            // this is only called when the client has outgoing unsynced individuals
            // ie the user created a new individual that wasn't synced right away
            if(applicationSettings.getBoolean('unsyncedIndividuals')) {
                console.log('there are unsynced individuals, syncing them now');
                this.currentlySyncing = "individuals";
                let individuals = await this._individualsService.syncIndividuals(lastSyncTimestamp);
                this.currentlySyncing = "individual images";
                await this.syncIndividualImages(individuals);
                applicationSettings.setBoolean('unsyncedIndividuals', false);
            }
            
            this.currentlySyncing = "individuals";
            lastSyncTimestamp = await this.getLastSyncTimeStamp(this._individualsService.tableName);
            let individuals: Individual[] = await this._individualsService.syncTable<Individual>(sites);
            this.progressValue += 1;
            
            this.currentlySyncing = "individual images";
            await this.syncIndividualImages(individuals);
            this.progressValue += 1;
            await this.updateLastSyncTimeStamp(this._individualsService.tableName);

            this.currentlySyncing = "site visit details";
            lastSyncTimestamp = await this.getLastSyncTimeStamp(this._observationGroupsService.tableName);
            let observationGroups = await this._observationGroupsService.syncObservationGroups(lastSyncTimestamp);
            await this.updateLastSyncTimeStamp(this._observationGroupsService.tableName);
            this.progressValue += 1;
            
            this.currentlySyncing = "observations";
            lastSyncTimestamp = await this.getLastSyncTimeStamp(this._observationService.tableName);
            let observations = await this._observationService.syncObservations(lastSyncTimestamp);
            await this.updateLastSyncTimeStamp(this._observationService.tableName);
            this.progressValue += 1;
                        
            this.syncing = false;
            let t2 = new Date();
            console.log('sync time: ' + (t2.getTime() - t1.getTime()));
            this._databaseService.logSyncInfo('syncAll completed in ' + (t2.getTime() - t1.getTime()));
            await allowSleepAgain();
        } catch (error) {
            this._databaseService.logSyncError(error);
            console.log(error);
            this.syncing = false;
            return error;
        }

    }

    async syncJoinedNetwork(joinedNetworkId: number) {
        console.log('begin sync joined network');
        let person = this._peopleService.selectedPerson;
        let networkPeople: NetworkPerson[] = await this._networkPeopleService.syncTable<NetworkPerson>([person], 'person_id', 'person_id');
        let networks: Network[] = await this._networksService.syncTable<Network>(networkPeople, 'network_id', 'network_id');
        let sites: Site[] = await this._sitesService.syncTable<Site>([person], 'person_id', 'observer_id', networks, 'network_id', 'network_id');
        let individuals: Individual[] = await this._individualsService.syncTable<Individual>(sites);
        this.syncIndividualImages(individuals);

        console.log('end sync joined network');
        // reload the model
        let t = new Date();
        console.log(t.getTime());
        console.log('loadPersonToNetworksMap');
        await this._networksService.loadPersonToNetworksMap();
        t = new Date();
        console.log(t.getTime());
        console.log('loadNetworksForPerson');
        await this._networksService.loadNetworksForPerson(this._peopleService.selectedPerson, joinedNetworkId);
        t = new Date();
        console.log(t.getTime());
        console.log('loadSitesForPerson');
        await this._sitesService.loadSitesForPerson(this._peopleService.selectedPerson, this._networksService.selectedNetwork);
        await this._sitesService.selectFirstSiteInGroup(this._networksService.selectedNetwork);
        t = new Date();
        console.log(t.getTime());
        console.log('loadIndividualsForSite');
        await this._individualsService.loadIndividualsForSite(this._sitesService.selectedSite);
        t = new Date();
        console.log(t.getTime());
        console.log('done!');
    }

    
    createTable() {
        let query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (table_name text, last_sync_timestamp integer)`;
        return this._databaseService.runQuery(this._databaseService.db, query, false);
    }

    async getLastSyncTimeStamp(table) {
        try {
            let query = `SELECT MAX(last_sync_timestamp) AS last_sync_timestamp FROM ${this.tableName} WHERE table_name = '${table}';`;
            let result = await this._databaseService.db.all(query);
            if (result && result[0] && result[0].last_sync_timestamp) {
                return result[0].last_sync_timestamp;
            } else {
                return 0;
            }
        } catch(error) {
            return 0;
        }
    }

    async updateLastSyncTimeStamp(table) {
        let timestamp = new Date().getTime();
        await this._databaseService.db.all(`DELETE FROM ${this.tableName} WHERE table_name = '${table}';`);
        let query = `INSERT OR REPLACE INTO ${this.tableName} (table_name, last_sync_timestamp) VALUES ('${table}', ${timestamp});`;
        return await this._databaseService.db.all(query);
    }
}