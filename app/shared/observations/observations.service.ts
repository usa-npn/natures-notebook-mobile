import {Observation} from "./Observation";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, throwError} from "rxjs";
import {SyncableTableService} from "../syncable-table-service";
import {Individual} from "../individuals/individual";
import {ObservationGroupsService} from "../observation-groups/observation-groups.service";
import {ObservationGroup} from "../observation-groups/observation-group";
import {OauthService} from "../oauth/oauth.service";
import {HttpHeaders, HttpClient} from "@angular/common/http";
import {PeopleService} from "../people/people.service";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";

@Injectable()
export class ObservationsService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _observationGroupsService: ObservationGroupsService,
                public _peopleService: PeopleService,
                public _oauthService: OauthService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('local_id', 'integer primary key');
        this.sqLiteTypes.set('observation_id', 'integer unique');
        this.sqLiteTypes.set('observer_id', 'integer');
        this.sqLiteTypes.set('submission_id', 'integer');
        this.sqLiteTypes.set('phenophase_id', 'integer');
        this.sqLiteTypes.set('observation_extent', 'integer');
        this.sqLiteTypes.set('comment', 'text');
        this.sqLiteTypes.set('individual_id', 'integer');
        this.sqLiteTypes.set('individual_local_id', 'integer');
        this.sqLiteTypes.set('observation_group_id', 'integer');
        this.sqLiteTypes.set('observation_group_local_id', 'integer');
        this.sqLiteTypes.set('protocol_id', 'integer');
        this.sqLiteTypes.set('raw_abundance_value', 'integer');
        this.sqLiteTypes.set('abundance_category', 'integer');
        this.sqLiteTypes.set('abundance_category_value', 'integer');
        this.sqLiteTypes.set('observation_date', 'text');
        this.sqLiteTypes.set('deleted', 'integer');
        this.sqLiteTypes.set('timestamp', 'integer');
        this.sqLiteTypes.set('sync_status', 'integer');
        this.sqLiteTypes.set('sync_message', 'text');
    }

    serviceName = 'observations';
    tableName = 'observations';
    primaryKey = 'observation_id';
    parentJoinColumn = 'observation_id';

    tableConstraints = ", CONSTRAINT one_phenophase_per_individual_per_date UNIQUE (phenophase_id, individual_id, observation_date)";

    serverTableColumns = [
        "observation_id",
        "observer_id",
        "submission_id",
        "phenophase_id",
        "observation_extent",
        "comment",
        "individual_id",
        "observation_group_id",
        "protocol_id",
        "raw_abundance_value",
        "abundance_category",
        "abundance_category_value",
        "observation_date",
        "deleted"
    ];

    additionalTableColumns: string[] = [
        'local_id',
        'observation_group_local_id',
        'individual_local_id',
        'timestamp',
        'sync_status',
        'sync_message'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    async getObservationsForIndividualAtTime(individual: Individual, date: Date) {
        let query = `SELECT * FROM ${this.tableName} WHERE (individual_local_id = ${individual.local_id} OR individual_id = ${individual.individual_id}) AND observation_date = '${date.toISOString()}'`;
        let results = await this.getDatabase().all(query);
        let observations = results.map(res => <Observation[]> res);
        return observations;
    }

    async dbObservationSameAsModel(obs: Observation): Promise<boolean> {
        let query = `SELECT COUNT(*) AS count FROM ${this.tableName}
            WHERE observer_id IS ${obs.observer_id} 
            AND phenophase_id IS ${obs.phenophase_id} 
            AND observation_extent IS ${obs.observation_extent} 
            AND comment IS "${obs.comment}" 
            AND individual_id IS ${obs.individual_id} 
            AND protocol_id IS ${obs.protocol_id} 
            AND raw_abundance_value IS ${obs.raw_abundance_value} 
            AND abundance_category IS ${obs.abundance_category} 
            AND abundance_category_value IS ${obs.abundance_category_value || null}
            AND observation_date IS '${obs.observation_date}' 
            AND local_id IS ${obs.local_id} 
            AND observation_group_local_id IS ${obs.observation_group_local_id}
            AND deleted IS ${obs.deleted}`;
        try {
            let result = await this._databaseService.db.get(query);
            return result && result.count > 0;
        } catch (error) {
            this._databaseService.logDbError(`QUERY: ${query} ERROR: ${error}`);
            return false;
        }
    }

    // returns the local_id of the observation after the save
    async insertObservation(observation: Observation): Promise<number> {
        observation.timestamp = new Date().getTime();

        observation.sync_message = null;
        observation.sync_status = 0;

        let mappedObjectsToInsert = this.tableColumns.map((column) => {
                return observation[column]
        });

        let questionMarks = this.tableColumns.map((el) => '?').join(',');
        let query = `INSERT INTO ${this.tableName} (${this.tableColumns.join(',')}) VALUES (${questionMarks})`;
        let result =  await this._databaseService.runQueryWithValues(this.getDatabase(), query, mappedObjectsToInsert);
        return result;
    }

    async updateObservation(observation: Observation): Promise<number> {
        observation.timestamp = new Date().getTime();

        observation.sync_message = null;
        observation.sync_status = 0;

        let mappedObjectsToInsert = this.tableColumns.map((column) => {
            return observation[column]
        });

        let questionMarks = this.tableColumns.map((el) => '?').join(',');
        let query = `INSERT OR REPLACE INTO ${this.tableName} (${this.tableColumns.join(',')}) VALUES (${questionMarks})`;
        let result =  await this._databaseService.runQueryWithValues(this.getDatabase(), query, mappedObjectsToInsert);
        return observation.local_id;
    }

    // avg should be 1 if all obs are successfully synced in the group by
    // min should be -1 if at least one obs in the group by has failed to sync
    // async getObservationsForSyncTable(account_id) {
    //     let query = `SELECT *,
    //     COUNT(o.observation_extent) AS completed,
    //     AVG(o.sync_status) AS avg_sync_status,
    //     MIN(o.sync_status) AS min_sync_status
    //     FROM observations o 
    //     LEFT JOIN station_species_individual ssi on (ssi.local_id = o.individual_local_id OR ssi.individual_id = o.individual_id)
    //     LEFT JOIN stations s on s.station_id = ssi.station_id
    //     WHERE o.observer_id = ${account_id}
    //     GROUP BY o.individual_id, o.observation_date;`;
    //     let results = await this.getDatabase().all(query);
    //     return results;
    // }

    async getObservationCompleteStatus(account_id, startDate, endDate, station_id, phenophaseCounts, numIndividualsAtSite) {
        let query = `SELECT o.observation_date, o.individual_id, o.protocol_id, 
        COUNT(o.observation_extent) AS completed
        FROM observations o 
        LEFT JOIN station_species_individual ssi on (ssi.local_id = o.individual_local_id OR ssi.individual_id = o.individual_id)
        LEFT JOIN stations s on s.station_id = ssi.station_id
        WHERE o.observer_id = ${account_id}
        AND o.deleted != 1
        AND s.station_id = ${station_id}
        AND o.observation_date >= '${startDate.toISOString()}'
        AND o.observation_date < '${endDate.toISOString()}'
        GROUP BY o.individual_id, o.observation_date
        ORDER BY o.individual_id;`;
        var t1 = new Date().getTime();
        let observations = await this.getDatabase().all(query);
        var t2 = new Date().getTime();
        console.log('complete status query time: ' + (t2 - t1));
        // for each obs set grouped by datetime and indiv, check if set size equals available phenophases
        let dailyCompleteStatus:Map<Date,boolean> = new Map();
        
        for (var obs of observations) {
            if(obs.completed === phenophaseCounts[obs.protocol_id]) {
                obs.finishedAllPhenophases = true;
            } else {
                obs.finishedAllPhenophases = false;
            }
        }

        // create map of days to boolean representing whether all phenophases were completed
        for (var day = new Date(startDate); day < endDate; day.setDate(day.getDate() + 1)) {
            let dateWithoutTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(),0,0,0,0);
            let today = day.getTime(); 
            let tomorrow = today + (24*60*60*1000); 

            // check if any individual doesn't have any observations (and mark day incomplete)
            let numIndividualsWithObservations = 0;
            let curIndividualId = null;
            for (var obs of observations) {
                let obsDate = new Date(obs.observation_date);
                if (obs.individual_id != curIndividualId
                    && obsDate.getTime() >= today 
                    && obsDate.getTime() < tomorrow) {
                    curIndividualId = obs.individual_id;
                    numIndividualsWithObservations += 1;
                }
            }
            if(numIndividualsWithObservations != 0 
                && numIndividualsWithObservations < numIndividualsAtSite) {
                dailyCompleteStatus.set(dateWithoutTime, false);
                //break;
            }

            for (var obs of observations) {
                let obsDate = new Date(obs.observation_date);
                if(dailyCompleteStatus.get(dateWithoutTime) != false
                    && obsDate.getTime() >= today 
                    && obsDate.getTime() < tomorrow) {
                    if(!obs.finishedAllPhenophases) {
                        dailyCompleteStatus.set(dateWithoutTime, false);
                    }
                    if(dailyCompleteStatus.get(dateWithoutTime) != false && obs.finishedAllPhenophases) {
                        dailyCompleteStatus.set(dateWithoutTime, true);
                    }
                }
            } 
        }

        return dailyCompleteStatus; 
    }

    async getObservationsSummary(account_id, startDate: Date, endDate: Date, station_id) {
        let query = `SELECT o.individual_id, o.observation_date, o.protocol_id, ssi.individual_userstr, 
        og.user_time AS user_time,
        COUNT(o.observation_extent) AS completed
        FROM observations o 
        LEFT JOIN station_species_individual ssi on (ssi.local_id = o.individual_local_id OR ssi.individual_id = o.individual_id)
        LEFT JOIN stations s on s.station_id = ssi.station_id
        LEFT JOIN observation_groups og on (og.observation_group_id = o.observation_group_id OR og.local_id = o.observation_group_local_id)
        WHERE o.observer_id = ${account_id}
        AND o.deleted != 1
        AND s.station_id = ${station_id}
        AND o.observation_date >= '${startDate.toISOString()}'
        AND o.observation_date < '${endDate.toISOString()}'
        GROUP BY o.individual_id, o.individual_local_id, o.observation_date
        ORDER BY o.observation_date, ssi.seq_num;`;
        let results = await this.getDatabase().all(query);
        return results;
    }

    async getLastSyncTimeStamp(table) {
        try {
            let query = `SELECT MAX(last_sync_timestamp) AS last_sync_timestamp FROM syncTable WHERE table_name = '${table}';`;
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

    async getUnsyncedObservations(account_id) {
        let lastSyncTimestamp = await this.getLastSyncTimeStamp(this.tableName);
        
        let query = `SELECT s.station_id, o.individual_id, o.observation_date, ssi.individual_userstr,
        og.user_time AS user_time,
        COUNT(o.observation_extent) AS completed
        FROM observations o 
        LEFT JOIN station_species_individual ssi on (ssi.local_id = o.individual_local_id OR ssi.individual_id = o.individual_id)
        LEFT JOIN stations s on s.station_id = ssi.station_id
        LEFT JOIN observation_groups og on og.observation_group_id = o.observation_group_id
        WHERE o.observer_id = ${account_id}
        AND o.deleted != 1
        AND (o.timestamp > ${lastSyncTimestamp} OR o.sync_status = 0)
        GROUP BY o.individual_id, o.individual_local_id, o.observation_date
        ORDER BY o.observation_date, s.station_name, ssi.individual_userstr;`;
        // AND (o.timestamp > ${lastSyncTimestamp} OR o.sync_status = 0)
        let unsynced = await this.getDatabase().all(query);
        return unsynced;
    }

    async getUnsyncedCount(account_id) {
        let lastSyncTimestamp = await this.getLastSyncTimeStamp(this.tableName);
        let query = `SELECT COUNT(*) AS unsyncCount
        FROM observations o 
        WHERE o.observer_id = ${account_id}
        AND o.deleted != 1
        AND (o.timestamp > ${lastSyncTimestamp} OR o.sync_status = 0);`;
        let unsynced = await this.getDatabase().all(query);
        if(unsynced != null && unsynced[0] != null && unsynced[0].unsyncCount != null)
            return unsynced[0].unsyncCount;
        else return 0;
    }

    sanitizeRawAbundanceValues() {
        let query = `UPDATE observations SET raw_abundance_value = NULL WHERE CAST(raw_abundance_value AS INTEGER) IS NOT raw_abundance_value;`;
        this._databaseService.db.execSQL(query)
            .then(result => {
                return result;
            })
            .catch(err => {
                console.log('ERROR: ' + err);
            });
    }

    // async checkIfAllAnimalsHaveAnObsOnDate(animals: Individual[], observationDate: Date) {
    //     let query = `SELECT COUNT(DISTINCT individual_id) AS animal_count
    //     FROM observations o 
    //     WHERE o.observation_date = '${observationDate.toISOString()}' AND o.individual_id IN (${animals.map(a => a.individual_id).join(',')});`;
    //     let results = await this.getDatabase().all(query);
    //     let numAnimalsWithObservations = results[0].animal_count;
    //     if (!animals || animals.length === 0)
    //         return false;
    //     return numAnimalsWithObservations === animals.length;
    // }


    private tzoffset = (new Date()).getTimezoneOffset() * 60000;
    sendObservationsToServer (observations: Observation[], lastSyncTimestamp, operationType) {
        const getUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + `${this.serviceName}`;


        let payload = observations.map(observation => {
            Object.keys(observation).forEach((key) => (observation[key] == null) && delete observation[key]);

            //before sending out, we need to convert from utc to localtime
            let localDateTime = new Date(observation.observation_date.replace(/ /g,"T"));
            observation.observation_date = new Date(localDateTime.getTime() - this.tzoffset).toISOString().slice(0, 19).replace('T', ' ');

            //note the timestamp is utc millis since 1970 of when the observation was last modified

            if(<unknown>observation.raw_abundance_value == '') {
               observation.raw_abundance_value = null; 
            }

            if (operationType === 'post') {
                return {
                    client_id: observation.local_id,
                    timestamp: observation.timestamp,
                    insert_object: observation
                }
            } else {
                return {
                    timestamp: observation.timestamp,
                    update_object: observation
                }
            }

        });

        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);

        console.log('userToken: ' + this._peopleService._selectedPerson.userToken);

        console.log(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        this._databaseService.logSyncInfo(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        if (operationType === 'post') {
            return this.http.post<Observation[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl + JSON.stringify(payload)}`);
                return throwError(err);
            }))
            .toPromise();
        } else if (operationType === 'put') {
            return this.http.put<Observation[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} PUT: ${getUrl + JSON.stringify(payload)}`);
                return throwError(err);
            }))
            .toPromise();
        } else {
            console.log('invalid operation type');
        }
    }

    async updateLocalDatabaseObservationAfterPost(local_id, objectToUpdate) {
        try {
            let serverObservationDateTime = new Date(objectToUpdate.observation_date.replace(/ /g,"T")+"Z");
            objectToUpdate.observation_date = new Date(serverObservationDateTime.getTime() + this.tzoffset).toISOString();
            // objectToUpdate.observation_date = serverObservationDateTime.toISOString();

            let query = `UPDATE ${this.tableName} SET ${this.serverTableColumns.map((el) => `${el} = ?`).join(',')}, sync_status = 1 WHERE local_id = ?`;
            let params = this.serverTableColumns.map((el) => objectToUpdate[el]).concat(local_id);
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };

    async updateLocalDatabaseObservationAfterPut(objectToUpdate) {
        try {
            console.log(`observation_date1: ${objectToUpdate.observation_date}`);
            let serverObservationDateTime = new Date(objectToUpdate.observation_date.replace(/ /g,"T")+"Z");
            objectToUpdate.observation_date = new Date(serverObservationDateTime.getTime() + this.tzoffset).toISOString();
            // objectToUpdate.observation_date = serverObservationDateTime.toISOString();
            console.log(`observation_date1: ${objectToUpdate.observation_date}`);

            let query = `UPDATE ${this.tableName} SET ${this.serverTableColumns.map((el) => `${el} = ?`).join(',')}, sync_status = 1 WHERE observation_id = ?`;
            let params = this.serverTableColumns.map((el) => objectToUpdate[el]).concat(objectToUpdate.observation_id);
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params)
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };

    async updateLocalDatabaseObservationId(local_id, observation_id) {
        try {
            let query = `UPDATE ${this.tableName} SET observation_id = ? WHERE local_id = ?`;
            let params = [observation_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);

            let observationWithUpdatedId = await this.getFromDatabaseWhere<Observation>('observation_id', observation_id);
            return observationWithUpdatedId[0];
        } catch (err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };


    async insertNewObservations(postObservations, lastSyncTimestamp) {
        // this represents observations that weren't inserted because they already exist on the server
        let updateInstead = [];
        if (postObservations && postObservations.length > 0) {
            let returnedServerObservations = await this.sendObservationsToServer(postObservations, lastSyncTimestamp, 'post');
            await this.getDatabase().execSQL('begin transaction');
            for (var serverObject of returnedServerObservations) {
                if (serverObject.inserted) {
                    console.log('the observation was inserted on the server');
                    let result = await this.updateLocalDatabaseObservationAfterPost(serverObject.client_id, serverObject.insert_object);
                } else {
                    console.log(`the observation wasnt inserted on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the observation wasnt inserted on the server. status: ${serverObject.status}`);
                    // in this case we update the local dbs observation_id to match what the server returned and add it
                    // to the put array so that the server can update instead of insert
                    if (serverObject.status === 'observation already exists') {
                        let localObservationWithUpdatedId = await this.updateLocalDatabaseObservationId(serverObject.client_id, serverObject.insert_object['observation_id']);
                        updateInstead.push(localObservationWithUpdatedId);
                    } else {
                        // todo nothing now
                    }
                }
            }
            await this.getDatabase().execSQL('commit');
        }
        return updateInstead;
    }

    async updateEditedObservations(putObservations, lastSyncTimestamp) {
        let insertInstead = [];
        if (putObservations && putObservations.length > 0) {
            let returnedServerObservations = await this.sendObservationsToServer(putObservations, lastSyncTimestamp, 'put');
            await this.getDatabase().execSQL('begin transaction');
            for (var serverObject of returnedServerObservations) {
                if (serverObject.updated) {
                    console.log('the observation was updated on the server');
                    let result = await this.updateLocalDatabaseObservationAfterPut(serverObject.update_object);
                } else {
                    console.log(`the observation wasnt updated on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the observation wasnt updated on the server. status: ${serverObject.status}`);
                    if (serverObject.status === "observation doesn't exists") {
                        insertInstead.push(serverObject.update_object);
                    } else if(serverObject.status === "server observation was newer than client update") {
                        let result = await this.updateLocalDatabaseObservationAfterPut(serverObject.update_object);
                    } else {
                        // todo nothing now
                    }
                }
            }
            await this.getDatabase().execSQL('commit');
        }
        return insertInstead;
    }

     /**
      * gets observations from local database that need to be synced because they either have sync_status = 0,
      * or a sufficiently high timestamp. Also only gets obs for individuals that exist in the db.
      * @param sites the sites for which to get individuals from the server
      * @returns promise of the observations that need to be synced
      */
    async getUnsyncedFromDatabase<T> (lastSyncTimestamp): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} o WHERE (o.timestamp > ${lastSyncTimestamp} OR o.sync_status = 0) AND EXISTS (SELECT 1 FROM station_species_individual ssi WHERE o.individual_id = ssi.individual_id)`;
        return (await this._databaseService.db.all(query)).map(row => <T[]> row);
    };

    /**
      * gets all observations from the local database that were added or modified since the most recent sync.
      * Then syncs those observations to the server.
      * @param lastSyncTimestamp timestamp of the most recent sync
      */
    async syncObservations(lastSyncTimestamp: number) {
        let unsyncedObservations: Observation[] = await this.getUnsyncedFromDatabase<Observation> (lastSyncTimestamp);
        let postObservations = unsyncedObservations.filter(obs => obs.observation_id == null);
        let putObservations = unsyncedObservations.filter(obs => obs.observation_id != null);

        console.log('post count: ' + postObservations.length);
        console.log('put count: ' + putObservations.length);

        // try to insert new observations via post; if obs already exists on the server we add to putObservations
        // array so that we can instead update via a put
        if (postObservations && postObservations.length > 0) {
            let updateInstead = await this.insertNewObservations(postObservations, lastSyncTimestamp);
            putObservations = putObservations.concat(updateInstead);
        }

        // try to update modified observations via put; if obs doesn't exist on the server we add to the insertInstead
        // array so that we can can add them to the server via a post
        let observationsSyncErrors = [];
        if (putObservations && putObservations.length > 0) {
            let insertInstead = await this.updateEditedObservations(putObservations, lastSyncTimestamp);
            observationsSyncErrors = await this.insertNewObservations(insertInstead, lastSyncTimestamp);
        }

    }

    async deleteObservationsForIndividual(individual_id) {
        let query = `UPDATE ${this.tableName} SET deleted = 1 WHERE individual_id = ${individual_id}`;
        return this._databaseService.runQuery(this.getDatabase(), query);
    }

}