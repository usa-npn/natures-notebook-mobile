import {Injectable} from "@angular/core";
import {DatabaseService} from "./database/database.service";
import {Observable, throwError} from "rxjs";
import {GenericTableService} from "./generic-table-service";
import { catchError, map } from "rxjs/operators";
import 'rxjs/add/operator/catch';
import { ConfigService } from "./config-service";
import { HttpClient } from "@angular/common/http";


//this service contains generic methods for tables that can be synced
@Injectable()
export abstract class SyncableTableService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);
        this.databaseName = "db"; //the main natures_notebook database (not the system db)
    }

    // get all rows from local db with timestamp greater than last sync time
    async getUnsyncedFromDatabase<T> (lastSyncTimestamp): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE timestamp > ${lastSyncTimestamp} OR sync_status = 0`;
        return (await this.getDatabase().all(query)).map(row => <T[]> row);
    };

    // this pull is scoped to only retrieve results for provided parents in the hierarchy
    getFromServerForParents<T> (parents: any[], parentJoinColumn: string, serverJoinColumn: string) {
        const getUrl = this.baseUrl + this.serviceName;
        let params = '';
        if (parents.length === 1) {
            params = `?${serverJoinColumn}='` + parents[0][parentJoinColumn] + "'";
        } else {
            let parent_ids = parents.map((parent) => parent[parentJoinColumn]).join();
            params = `?${serverJoinColumn}=` + parent_ids;
        }
        console.log(`retrieving ${getUrl + params}`);
        this._databaseService.logSyncInfo(`GET: ${getUrl + params}`);
        return this.http.get<T[]>(getUrl + params)
        .pipe(catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} GET: ${getUrl + params}`);
            return throwError(err);
        }))
        .toPromise();
    }

    // only pulls data from the server to update the local database
    // local database data isn't being sent off here
    // pulls are scoped to only get data for parents/otherParents
    // for example, when pulling sites, get them for explicit people (parents) and networks (otherParents)
    async syncTable<T>(parents: any, parentJoinColumn: string, serverJoinColumn: string, otherParents?: any, otherParentJoinColumn?: string, otherServerJoinColumn?: string) {

        let parent_ids = parents.map((parent) => parent[parentJoinColumn]).join();

        let [serverObjects, otherServerObjects, dbObjects ] = await Promise.all([
            parents.length > 0 ? this.getFromServerForParents<T>(parents, parentJoinColumn, serverJoinColumn) : [],
            (otherParents && otherParents.length > 0) ? this.getFromServerForParents<T>(otherParents, otherParentJoinColumn, otherServerJoinColumn) : [],
            this.getFromDatabaseWhere<T>(parentJoinColumn, parent_ids)
        ]);
        serverObjects = serverObjects.concat(otherServerObjects);

        //remove groups from database that weren't returned from the server
        await this.startTransaction();
        for(var dbObject of dbObjects) {
            if (!serverObjects.some((serverObject) => serverObject[this.primaryKey] == dbObject[this.primaryKey])) {
                let result = await this.deleteFromDatabase(dbObject);
            }
        }
        await this.commitTransaction();

        //insert or update each serverGroup in the database
        await this.startTransaction();
        for (var serverObject of serverObjects) {
            if (dbObjects.some((dbObject) => serverObject[this.primaryKey] == dbObject[this.primaryKey])) {
                await this.updateInDatabase(serverObject);
            }
            else {
                await this.insertIntoDatabase(serverObject);
            }
        }
        await this.commitTransaction();
        
        return serverObjects;
    }

}