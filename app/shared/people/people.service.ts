import {Person} from "./person";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, of, throwError} from "rxjs";
import 'rxjs/add/operator/catch';
import { HttpClient, HttpHeaders } from "@angular/common/http";

import {SyncableTableService} from "../syncable-table-service";
import { OauthService } from "../oauth/oauth.service";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";
const applicationSettings = require("application-settings");

@Injectable()
export class PeopleService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _oauthService: OauthService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('person_id', 'integer primary key');
        this.sqLiteTypes.set('first_name', 'text');
        this.sqLiteTypes.set('last_name', 'text');
        this.sqLiteTypes.set('username', 'text');
        this.sqLiteTypes.set('email', 'integer');
        this.sqLiteTypes.set('deleted', 'integer');
    }

    serviceName = 'people';
    tableName = 'people';
    primaryKey = 'person_id';
    parentJoinColumn = 'person_id'; //not really used here, since people are at the top of the hierarchy

    serverTableColumns = [
        'person_id',
        'first_name',
        'last_name',
        'username',
        'email'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public people: Person[] = [];
    public _selectedPerson: Person;
    public newAccountAdded: boolean = false;

    // setter and getter used here to accommodate retaining the selectedPerson in the localstore when app is closed
    set selectedPerson(selectedPerson: Person) {
        for(let person of this.people) {
            (person.person_id === selectedPerson.person_id) ? person.selected = true : person.selected = false;
        }
        this._selectedPerson = selectedPerson;
        applicationSettings.setString('selectedPersonID', selectedPerson.person_id.toString());
    }

    get selectedPerson() {
        // first try and grab the person matching the person_id saved in the local store
        let storedPersonId = null;
        try {
            storedPersonId = +applicationSettings.getString('selectedPersonID');
        } catch(err) {
            applicationSettings.getNumber('selectedPersonID');
        }
        for(let person of this.people) {
            if (person.person_id === storedPersonId) {
                this._selectedPerson = person;
                person.selected = true;
                return person;
            }
        }
        // otherwise attempt to select the first person if there are any people
        if (this.people.length > 0) {
            this._selectedPerson = this.people[0];
            this.people[0].selected = true;
            return this.people[0];
        } else {
            return null;
        }
    }

    async getPersonFromServer(accessToken, consumerKey) {
        console.log('retrieving person from server');
        const serviceRequest = `${this.serviceName}?access_token=${accessToken}&consumer_key=${consumerKey}`;
        const getUrl = this.baseUrl + serviceRequest;
        console.log(getUrl);
        let people = await this.http.get<Person[]>(getUrl)
        .pipe(catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} PUT: ${getUrl}`);
            return [];
        }))
        .toPromise();
        return people;
        // return [{
        //     "person_id": 26318,
        //     "first_name": "Fake",
        //     "last_name": "",
        //     "username": "loltest27",
        //     "email": "lol@test27.com",
        //     "selected": true, 
        //     "deleted": 0, 
        //     "userToken": null, 
        //     "completed_signup": 1
        //   }];
    }

    loadPeopleTokens() {
        for(let person of this.people) {
            person.userToken = applicationSettings.getString(`userToken${person.person_id}`);
        }
    }

    putPeople (people: Person[]) {
        const getUrl = this.baseUrl + `${this.serviceName}`;

        let payload = people.map((person) => {
            Object.keys(person).forEach((key) => (person[key] == null) && delete person[key]);
            return {
                client_timestamp: new Date().getTime(),
                update_object: person
            }
        });

        let userToken = applicationSettings.getString(`userToken${people[0].person_id}`);
        let options = this._oauthService.getRequestOptions(userToken);

        console.log('userToken: ' + userToken);

        console.log(`PUT: ${getUrl + JSON.stringify(payload)}`);
        this._databaseService.logSyncInfo(`PUT: ${getUrl + JSON.stringify(payload)}`);
        
        return this.http.put<Person>(getUrl, payload, options)
        .pipe(catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} PUT: ${getUrl + JSON.stringify(payload)}`);
            return throwError(err);
        }))
        .toPromise();
    }

}
