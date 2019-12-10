import {NetworkPerson} from "./network-person";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, throwError, of} from "rxjs";
import { catchError } from "rxjs/operators";
import {SyncableTableService} from "../syncable-table-service";
import {Person} from "../people/person";
import {NetworkHierarchy} from "./network-hierarchy";
import {OauthService} from "../oauth/oauth.service";
import {PeopleService} from "../people/people.service";
import { map } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";
var applicationSettings = require("application-settings");

@Injectable()
export class NetworkPeopleService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _peopleService: PeopleService,
                public _oauthService: OauthService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('network_person_id', 'integer primary key');
        this.sqLiteTypes.set('network_id', 'integer');
        this.sqLiteTypes.set('person_id', 'integer');
        this.sqLiteTypes.set('is_admin', 'integer');
        this.sqLiteTypes.set('deleted', 'integer');
    }

    serviceName = 'network_person';
    tableName = 'network_person';
    primaryKey = 'network_person_id';
    // parentJoinColumn = 'person_id';

    serverTableColumns = [
        'network_person_id',
        'network_id',
        'person_id',
        'is_admin'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    async joinNetwork (person_id: number, network_id: number) {
        const getUrl = this.baseUrl + 'network_person';
        let networkPerson = {
            network_id: network_id,
            person_id: person_id
        };

        let payload = [{
            insert_object: networkPerson
        }];

        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);
        this._databaseService.logSyncInfo(`POST: ${getUrl + JSON.stringify(payload)}`);
      
        let serverResponse = await this.http.post(getUrl, payload, options)
        .pipe(
            map(r => {
                if(r[0] && r[0].insert_object && r[0].insert_object.network_id) {
                    return r[0].insert_object.network_id;
                } else {
                    this._databaseService.logSyncError(`ERROR: could not join network as server response had no network_id: ${JSON.stringify(r)}`);
                    return null;
                }  
            }),
            catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl + JSON.stringify(payload)}`);
            return null;
        }))
        .toPromise();

        return serverResponse;
        
    }

}