import {ObservationGroup} from "./observation-group";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {SyncableTableService} from "../syncable-table-service";
import {Subject} from "rxjs";
import {BehaviorSubject, throwError} from "rxjs";
import {Observation} from "../observations/Observation";
import {IndividualsService} from "../individuals/individuals.service";
import {Individual} from "../individuals/individual";
import {Site} from "../sites/site";
import {Person} from "../people/person";
import {OauthService} from "../oauth/oauth.service";
import {PeopleService} from "../people/people.service";
import { SettingsService } from "../settings/settings.service";
import { map, catchError } from 'rxjs/operators';
import 'rxjs/add/operator/catch';
import { ConfigService } from "../config-service";
import { ScistarterService } from "../scistarter/scistarter.service";
import { HttpClient } from "@angular/common/http";
var applicationSettings = require("application-settings");

@Injectable()
export class ObservationGroupsService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _peopleService: PeopleService,
                public _oauthService: OauthService,
                public _settingsService: SettingsService,
                public _configService: ConfigService,
                public _scistarterService: ScistarterService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('local_id', 'integer primary key');
        this.sqLiteTypes.set('station_id', 'integer');
        this.sqLiteTypes.set('observation_group_date', 'text');
        this.sqLiteTypes.set('observer_id', 'integer');
        this.sqLiteTypes.set('observation_group_id', 'integer unique');
        this.sqLiteTypes.set('travel_time', 'integer');
        this.sqLiteTypes.set('travel_time_units_id', 'integer');
        this.sqLiteTypes.set('time_spent', 'integer');
        this.sqLiteTypes.set('time_spent_units_id', 'integer');
        this.sqLiteTypes.set('duration_of_search', 'integer');
        this.sqLiteTypes.set('duration_of_search_units_id', 'integer');
        this.sqLiteTypes.set('snow_ground', 'integer');
        this.sqLiteTypes.set('snow_ground_coverage', 'integer');
        this.sqLiteTypes.set('snow_overstory_canopy', 'integer');
        this.sqLiteTypes.set('method', 'text');
        this.sqLiteTypes.set('user_time', 'integer');
        this.sqLiteTypes.set('notes', 'text');
        this.sqLiteTypes.set('num_observers_searching', 'integer');
        this.sqLiteTypes.set('timestamp', 'integer');
        this.sqLiteTypes.set('sync_status', 'integer');
        this.sqLiteTypes.set('sync_message', 'text');
        this.sqLiteTypes.set('deleted', 'integer');
    }

    serviceName = 'observation_group';
    tableName = 'observation_groups';
    primaryKey = 'observation_group_id';
    parentJoinColumn = 'observation_group_id';

    serverTableColumns = [
        'observation_group_id',
        "travel_time",
        "travel_time_units_id",
        "time_spent",
        "time_spent_units_id",
        "duration_of_search",
        "duration_of_search_units_id",
        "snow_ground",
        "snow_ground_coverage",
        "snow_overstory_canopy",
        "method",
        "user_time",
        "notes",
        "num_observers_searching",
        "observation_group_date",
        "observer_id",
        "station_id",
        "timestamp"
    ];

    additionalTableColumns: string[] = [
        'local_id',
        'deleted',
        'sync_status',
        'sync_message'
    ];

    
    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    // this keeps track of which animals have a recorded observation
    animalIdToHasObservation = new Map<string, boolean>();

    public selectedObservationGroup: ObservationGroup;
    public selectedDate: BehaviorSubject<Date> = new BehaviorSubject<Date>(this.getInitialDate());

    getInitialDate() {
        this.selectedObservationGroup = null;
        let d = new Date();
        d.setSeconds(0);
        d.setMilliseconds(0);
        if(!this._settingsService.recordObservationTime) {
            d.setHours(0);
            d.setMinutes(0); 
        }
        return d;
    }

    resetDate() {
        this.selectedDate.next(this.getInitialDate());
    }

    // sets selectedObservationGroup by looking in db for matching date, site, and person
    // if one doesn't already exist it's first created in the database
    async setSelectedObservationGroup(date: Date, selectedSite: Site, selectedPerson: Person) {
        let observationGroup = await this.getObservationGroup(date, selectedSite, selectedPerson);
        if (observationGroup != null) {
            this.selectedObservationGroup = observationGroup;
        } else {
            let newObsGroup = new ObservationGroup(this._settingsService.recordObservationTime);
            await this.saveObservationGroup(newObsGroup, date, selectedSite, selectedPerson);
            this.selectedObservationGroup = newObsGroup;
        }
    }

    // searches for an observation group based on date, observer_id, and station_id
    async getObservationGroup(date: Date, selectedSite: Site, selectedPerson: Person) {
        let query = `SELECT * FROM ${this.tableName} WHERE observation_group_date = '${date.toISOString()}' AND observer_id = ${selectedPerson.person_id} AND station_id = ${selectedSite.station_id}`;
        console.log(query);
        let results = await this.getDatabase().all(query);
        let observationGroups = results.map(res => <ObservationGroup[]> res);
        if (observationGroups.length > 0) {
            return observationGroups[0];
        }
        else {
            return null;
        }
    }

    getDateText(date: Date|string): string {
        if (!date || date as string === "") {
            return "date not set"
        }
        let d = (typeof date === "string") ? new Date(date) : date as Date;
        if(this._settingsService.recordObservationTime) {
            return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} : ${d.getHours()}:${d.getMinutes()}`;
        } else {
            return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        }
    }

    isNumber(val) {
        return !isNaN(val) && val != '';
    }

    observationGroupIsEmpty(observationGroup: ObservationGroup) {
        return (observationGroup.duration_of_search == null
            && observationGroup.travel_time == null
            && observationGroup.snow_overstory_canopy == null
            && observationGroup.snow_ground_coverage == null
            && observationGroup.snow_ground == null
            && observationGroup.method == null
            && observationGroup.time_spent == null
            && observationGroup.notes == null
            && observationGroup.num_observers_searching == null);
    }

    async updateObservationGroup(og: ObservationGroup) {
        try {
            console.log('updating observation group');
            og.timestamp = new Date().getTime();
            this.isNumber(og.travel_time) ? og.travel_time_units_id = 278 : og.travel_time = null;
            this.isNumber(og.time_spent) ? og.time_spent_units_id = 278 : og.time_spent = null;
            this.isNumber(og.duration_of_search) ? og.duration_of_search_units_id = 278 : og.duration_of_search = null;

            if(!this.isNumber(og.snow_ground_coverage))
                og.snow_ground_coverage = null;

            if(!this.isNumber(og.num_observers_searching))
                og.num_observers_searching = null;

            let query = `
            UPDATE ${this.tableName} SET 
            travel_time = ?, travel_time_units_id = ?, time_spent = ?, time_spent_units_id = ?, duration_of_search = ?, 
            duration_of_search_units_id = ?, snow_ground = ?, snow_ground_coverage = ?, snow_overstory_canopy = ?, 
            method = ?, user_time = ?, notes = ?, num_observers_searching = ?, timestamp = ? WHERE local_id = ?;
            `;
            let params = [og.travel_time, og.travel_time_units_id, og.time_spent, og.time_spent_units_id, og.duration_of_search,
                og.duration_of_search_units_id, og.snow_ground, og.snow_ground_coverage, og.snow_overstory_canopy, og.method,
                og.user_time, og.notes, og.num_observers_searching, og.timestamp, og.local_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    }

    async saveObservationGroup(og: ObservationGroup, observationGroupDate: Date, selectedStation: Site, selectedPerson: Person) {
        try {
            console.log('inserting observation group');

            this.isNumber(og.travel_time) ? og.travel_time_units_id = 278 : og.travel_time = null;
            this.isNumber(og.time_spent) ? og.time_spent_units_id = 278 : og.time_spent = null;
            this.isNumber(og.duration_of_search) ? og.duration_of_search_units_id = 278 : og.duration_of_search = null;

            if(!this.isNumber(og.snow_ground_coverage))
                og.snow_ground_coverage = null;

            if(!this.isNumber(og.num_observers_searching))
                og.num_observers_searching = null;

            og.timestamp = new Date().getTime();

            let mappedObjectsToInsert = this.tableColumns.map((column) => {
                if (column === 'deleted')
                    return false;
                if (column === 'station_id')
                    return selectedStation.station_id;
                if (column === 'observer_id')
                    return selectedPerson.person_id;
                if (column === 'observation_group_date')
                    return observationGroupDate.toISOString();
                else
                    return og[column]
            });

            let questionMarks = this.tableColumns.map((el) => '?').join(',');
            let query = `INSERT OR REPLACE INTO ${this.tableName} (${this.tableColumns.join(',')}) VALUES (${questionMarks})`;
            og.local_id = await this.getDatabase().execSQL(query, mappedObjectsToInsert);
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${mappedObjectsToInsert}`);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    }

    async updateLocalDatabaseObservationGroupIds(local_id, observation_group_id) {
        try {
            // updates the primary key to match the server for the observation_group
            let query = `UPDATE ${this.tableName} SET observation_group_id = ?, sync_status = 1 WHERE local_id = ?`;
            let params = [observation_group_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }

        try {
            //update observations with local_id to instead map to observation_group_id that was generated by the server
            let query2 = `UPDATE observations SET observation_group_id = ? WHERE observation_group_local_id = ?`;
            let params2 = [observation_group_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query2} VALUES: ${params2}`);
            await this.getDatabase().execSQL(query2, params2)
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }

        let observationGroupWithUpdatedId = await this.getFromDatabaseWhere<ObservationGroup>('observation_group_id', observation_group_id);
        return observationGroupWithUpdatedId[0];
    };

    async updateLocalDatabaseObservationGroupAfterPut(objectToUpdate, local_id) {
        try {
            let serverObservationGroupDateTime = new Date(objectToUpdate.observation_group_date.replace(/ /g,"T")+"Z");
            objectToUpdate.observation_group_date = new Date(serverObservationGroupDateTime.getTime() + this.tzoffset).toISOString();
            let query = `UPDATE ${this.tableName} SET ${this.serverTableColumns.map((el) => `${el} = ?`).join(',')}, sync_status = 1 WHERE local_id = ?`;
            let params = this.serverTableColumns.map((el) => objectToUpdate[el]).concat(local_id);
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);

            // this is to update the server observation_group_id in the local database if there was a conflict 
            // (more than one observation group) on the server for a station, date, person
            let query2 = `UPDATE observations SET observation_group_id = ? WHERE observation_group_local_id = ?`;
            let params2 = [objectToUpdate.observation_group_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query2} VALUES: ${params2}`);
            await this.getDatabase().execSQL(query2, params2);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };

    private tzoffset = (new Date()).getTimezoneOffset() * 60000;
    sendObservationGroupsToServer (observationGroups: ObservationGroup[], lastSyncTimestamp: number, operationType: string) {
        const getUrl = this.baseUrl + `${this.serviceName}s`;

        let payload = observationGroups.map(observationGroup => {
            Object.keys(observationGroup).forEach((key) => (observationGroup[key] == null) && delete observationGroup[key]);

            //before sending out, we need to convert from utc to localtime
            let localDateTime = new Date(observationGroup.observation_group_date.replace(/ /g,"T"));
            observationGroup.observation_group_date = new Date(localDateTime.getTime() - this.tzoffset).toISOString().slice(0, 19).replace('T', ' ');

            if (operationType === 'post') {
                return {
                    client_id: observationGroup.local_id,
                    timestamp: lastSyncTimestamp,
                    insert_object: observationGroup
                }
            } else {
                return {
                    timestamp: lastSyncTimestamp,
                    update_object: observationGroup
                }
            }

        });

        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);

        console.log(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        this._databaseService.logSyncInfo(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        if (operationType === 'post') {
            return this.http.post<ObservationGroup[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl + JSON.stringify(payload)}`);
                return throwError(err);
            }))
            .toPromise();
        } else if (operationType === 'put') {
            return this.http.put<ObservationGroup[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} PUT: ${getUrl + JSON.stringify(payload)}`);
                return throwError(err);
            }))
            .toPromise();
        } else {
            //todo handle this
            console.log('invalid operation type');
        }
    }

    async insertNewObservationGroups(postObservationGroups, lastSyncTimestamp) {
        // this represents observation groups that weren't inserted because they already exist on the server
        let updateInstead = [];
        if (postObservationGroups && postObservationGroups.length > 0) {
            let returnedServerObservationGroups = await this.sendObservationGroupsToServer(postObservationGroups, lastSyncTimestamp, 'post');
            for (var serverObject of returnedServerObservationGroups) {
                let obsGroup_id = serverObject.insert_object['observation_group_id'];
                if (serverObject.inserted) {
                    console.log(`observationGroup ${obsGroup_id} was inserted on the server`);
                    let localObservationWithUpdatedId = await this.updateLocalDatabaseObservationGroupIds(serverObject.client_id, obsGroup_id);
                    // note we don't await this call since we don't care about the response and don't want ui to slow down
                    this._scistarterService.recordCollectionEvent(obsGroup_id);
                } else {
                    console.log(`the observationGroup ${obsGroup_id} was not inserted on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the observationGroup ${obsGroup_id} was not inserted on the server. status: ${serverObject.status}`);
                    // in this case we update the local dbs observation_id to match what the server returned and add it
                    // to the put array so that the server can update instead of insert
                    if (serverObject.status === 'observationGroup already exists') {
                        let localObservationWithUpdatedId = await this.updateLocalDatabaseObservationGroupIds(serverObject.client_id, obsGroup_id);
                        updateInstead.push(localObservationWithUpdatedId);
                    } else {
                        // todo: nothing now
                    }
                }
            }
        }
        return updateInstead;
    }

    async updateEditedObservationGroups(putObservationGroups, lastSyncTimestamp) {
        let insertInstead = [];
        if (putObservationGroups && putObservationGroups.length > 0) {
            let returnedServerObservationGroups = await this.sendObservationGroupsToServer(putObservationGroups, lastSyncTimestamp, 'put');
            for (var serverObject of returnedServerObservationGroups) {
                if (serverObject.updated) {
                    console.log('the observationGroup was updated on the server');
                    let result = await this.updateLocalDatabaseObservationGroupAfterPut(serverObject.update_object, serverObject.local_id);
                } else {
                    console.log(`the observationGroup wasnt updated on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the observationGroup wasnt updated on the server. status: ${serverObject.status}`);
                    if (serverObject.status === "observationGroup doesn't exists") {
                        insertInstead.push(serverObject.update_object);
                    } else if(serverObject.status === "server observationGroup was newer than client update") {
                        let result = await this.updateLocalDatabaseObservationGroupAfterPut(serverObject.update_object, serverObject.local_id);
                    } else {
                        //todo: nothing now
                    }
                }
            }
        }
        return insertInstead;
    }

    async syncObservationGroups(lastSyncTimestamp: number) {
        let unsyncedObservationGroups: ObservationGroup[] = await this.getUnsyncedFromDatabase<ObservationGroup> (lastSyncTimestamp);

        let postObservationGroups = unsyncedObservationGroups.filter(obsGroup => obsGroup.observation_group_id == null);
        let putObservationGroups = unsyncedObservationGroups.filter(obsGroup => obsGroup.observation_group_id != null);

        console.log('post count: ' + postObservationGroups.length);
        console.log('put count: ' + putObservationGroups.length);

        // try to insert new observationGroups via post; if obs already exists on the server we add to putObservationGroups
        // array so that we can instead update via a put
        if (postObservationGroups && postObservationGroups.length > 0) {
            let updateInstead = await this.insertNewObservationGroups(postObservationGroups, lastSyncTimestamp);
            putObservationGroups = putObservationGroups.concat(updateInstead);
        }

        // try to update modified observationGroups via put; if obs doesn't exist on the server we add to the insertInstead
        // array so that we can can add them to the server via a post
        if (putObservationGroups && putObservationGroups.length > 0) {
            let insertInstead = await this.updateEditedObservationGroups(putObservationGroups, lastSyncTimestamp);
            let observationGroupsSyncErrors = await this.insertNewObservationGroups(insertInstead, lastSyncTimestamp);
        }

    }

}