import {Injectable} from "@angular/core";
import {HttpHeaders, HttpClient} from "@angular/common/http";
const applicationSettings = require("@nativescript/core/application-settings");
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import config from '../../configuration.js';


import { ScistarterProfileResponse, ScistarterRecordEventResponse } from './scistarterResponse';
const sha256 = require("crypto-js/sha256");
const hex = require('crypto-js/enc-hex');
import { PeopleService } from "../people/people.service";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class ScistarterService {

    constructor(public http: HttpClient,
        private _peopleService: PeopleService,
        private _databaseService: DatabaseService) {
        this.baseUrl = 'https://scistarter.org';
        this.project_id = 7;
        this.k = config.scistarterkey;
    }

    private baseUrl: string;
    private k: string;
    private project_id = 7;

    getProfile() {
        return new Promise ((resolve, reject) => {
            console.log('in getProfile');
            let emailHash = sha256(this._peopleService.selectedPerson.email).toString(hex);
            
            return this.http.get<ScistarterProfileResponse>(this.baseUrl+`/api/profile/id?hashed=${emailHash}&key=${this.k}`)
            .toPromise().then((profile) => {
                if(profile.known) {
                    applicationSettings.setString(`scistarter_profile_${this._peopleService.selectedPerson.person_id}`, profile.scistarter_profile_id.toString());
                } else {
                    applicationSettings.setString(`scistarter_profile_${this._peopleService.selectedPerson.person_id}`, "-1");
                }
                resolve(true);
            });
        });
    }

    async getNumberOfIndividualsInObsGroup(observation_group_id): Promise<number> {
        try {
            let query = `SELECT COUNT(*) AS num_individuals FROM observation_groups og
            LEFT JOIN station_species_individual ssi ON ssi.station_id = og.station_id
            WHERE og.observation_group_id = ?`;
            let params = [observation_group_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            let result = await this._databaseService.db.get(query, params);
            if(result['num_individuals']) {
                return result['num_individuals']
            } else {
                return 1;
            }
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    }

    async getObservationGroupTime(observation_group_id): Promise<string> {
        try {
            let query = `SELECT observation_group_date FROM observation_groups og
            WHERE og.observation_group_id = ?`;
            let params = [observation_group_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            let result = await this._databaseService.db.get(query, params);
            //scistart wants format yyyy-mm-ddThh:mm:ss (note the T)
            if(result['observation_group_date']) {
                return result['observation_group_date'].split('.')[0];
            } else {
                // return the current datetime
                return new Date().toISOString().split('.')[0];
            }
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    }

    recordCollectionEvent(observationGroupId) {
        return new Promise (async (resolve, reject) => {
            // console.log('recording a scistarter collection');
            // let profile_id = 1;
            let profile_id = +applicationSettings.getString(`scistarter_profile_${this._peopleService.selectedPerson.person_id}`);
            if (profile_id == null || profile_id == -1)
                resolve(true);

            // #rm 2071 duration observed is #individuals in station * 2
            let duration = await this.getNumberOfIndividualsInObsGroup(observationGroupId) * 2 * 60;
            let timeObservered = await this.getObservationGroupTime(observationGroupId);

            const httpOptions = {
                headers: new HttpHeaders({
                  'Content-Type':  'application/x-www-form-urlencoded',
                  'Authorization': 'my-auth-token'
                })
              };
            let body = `profile_id=${profile_id}&project_id=${this.project_id}&type=collection&duration=${duration}&when=${timeObservered}`;
            // console.log(body);

            return this.http.post<ScistarterRecordEventResponse>(this.baseUrl+`/api/record_event?key=${this.k}`,body, httpOptions)
            .toPromise().then((result) => {
                resolve(true);
            });
        });
    }


}
