import {Individual} from "./individual";
import {Species} from "../species/species";
import {SpeciesProtocol} from "../species/species_protocol";
import {Site} from "../sites/site";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, throwError} from "rxjs";
import {SyncableTableService} from "../syncable-table-service";
import {SpeciesService} from "../species/species.service";
import {SpeciesProtocolsService} from "../species/species-protocols.service";
import {SpeciesSpecificPhenophaseInformationService} from "../species/species-specific-phenophase-information.service";
import {SpeciesSpecificPhenophaseInformation} from "../species/species-specific-phenophase-information";
import {ObservationsService} from "../observations/observations.service";
import {Observation} from "../observations/Observation";
import {ObservationGroupsService} from "../observation-groups/observation-groups.service";
import {ObservationGroup} from "../observation-groups/observation-group";
import {SpeciesTypesService} from "../species/species-types.service";
import {SpeciesSpeciesTypesService} from "../species/species-species-types.service";
const platform = require("@nativescript/core/platform");
import {Person} from "../people/person";
import { PeopleService } from "../people/people.service";
import { OauthService } from "../oauth/oauth.service";
import { from } from 'rxjs';
import { map, catchError } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

// var imageSource = require("@nativescript/core/image-source");
import { ImageSource } from "@nativescript/core/image-source";
var fs = require("@nativescript/core/file-system");

@Injectable()
export class IndividualsService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _peopleService: PeopleService,
                private _speciesService: SpeciesService,
                private _speciesTypesService: SpeciesTypesService,
                private _speciesSpeciesTypesService: SpeciesSpeciesTypesService,
                private _speciesProtocolService: SpeciesProtocolsService,
                private _speciesSpecificInformation: SpeciesSpecificPhenophaseInformationService,
                public _oauthService: OauthService,
                private _observationsService: ObservationsService,
                private _observationGroupsService: ObservationGroupsService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('local_id', 'integer primary key');
        this.sqLiteTypes.set('individual_id', 'integer unique');
        this.sqLiteTypes.set('station_id', 'integer');
        this.sqLiteTypes.set('species_id', 'integer');
        this.sqLiteTypes.set('individual_userstr', 'text');
        this.sqLiteTypes.set('shade_status', 'text');
        this.sqLiteTypes.set('watering', 'integer');
        this.sqLiteTypes.set('is_group', 'integer');
        this.sqLiteTypes.set('comment', 'text');
        this.sqLiteTypes.set('active', 'integer');
        this.sqLiteTypes.set('seq_num', 'integer');
        this.sqLiteTypes.set('last_alive_date', 'text');
        this.sqLiteTypes.set('death_observed_date', 'text');
        this.sqLiteTypes.set('death_reason', 'text');
        this.sqLiteTypes.set('death_comment', 'text');
        this.sqLiteTypes.set('is_wild', 'integer');
        this.sqLiteTypes.set('supplemental_feeding', 'integer');
        this.sqLiteTypes.set('clone_line_id', 'integer');
        this.sqLiteTypes.set('planting_date_day', 'text');
        this.sqLiteTypes.set('planting_date_month', 'text');
        this.sqLiteTypes.set('planting_date_year', 'text');
        this.sqLiteTypes.set('inactivate_comment', 'text');
        this.sqLiteTypes.set('create_date', 'text');
        this.sqLiteTypes.set('shutter_open', 'text');
        this.sqLiteTypes.set('gender', 'text');
        this.sqLiteTypes.set('patch', 'integer');
        this.sqLiteTypes.set('patch_size', 'integer');
        this.sqLiteTypes.set('patch_size_units_id', 'integer');
        this.sqLiteTypes.set('file_url', 'text');
        this.sqLiteTypes.set('deleted', 'integer');
        this.sqLiteTypes.set('timestamp', 'integer');
        this.sqLiteTypes.set('sync_status', 'integer');
        this.sqLiteTypes.set('sync_message', 'text');
    }

    serviceName = 'station_species_individuals';
    tableName = 'station_species_individual';
    primaryKey = 'individual_id';

    serverTableColumns = [
        'individual_id',
        'station_id',
        'species_id',
        'individual_userstr',
        'shade_status',
        'watering',
        'is_group',
        'comment',
        'active',
        'seq_num',
        'last_alive_date',
        'death_observed_date',
        'death_reason',
        'death_comment',
        'is_wild',
        'supplemental_feeding',
        'clone_line_id',
        'planting_date_day',
        'planting_date_month',
        'planting_date_year',
        'inactivate_comment',
        'create_date',
        'shutter_open',
        'gender',
        'patch',
        'patch_size',
        'patch_size_units_id',
        'file_url'
    ];

    additionalTableColumns: string[] = [
        'local_id',
        'timestamp',
        'sync_status',
        'sync_message'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public individuals: Individual[];
    public plants: Individual[];
    public animals: Individual[];

    public fromReviewScreen = false;
    public selectedIndividual: Individual;

    /**
     * Retrieves individuals from the database ordered by seq_num.
     * @param sites Stations to get individuals from.
     */
    getStationSpeciesIndividualsFromDatabase(sites: Site[]) {
        console.log('retrieving individuals from database');
        let ssiQuery: string;
        if (sites.length === 1) {
            ssiQuery = `SELECT * FROM ${this.tableName} WHERE station_id = ${sites[0].station_id} ORDER BY seq_num`;

        } else {
            let station_ids = sites.map((site) => site.station_id).join();
            ssiQuery = `SELECT * FROM ${this.tableName} WHERE station_id IN (${station_ids}) ORDER BY seq_num`
        }
        return from(this.getDatabase().all(ssiQuery)).pipe(
            map(res => <Individual[]> res),
            catchError(this.handleErrors)
        ).toPromise();
    }

    /**
      * gets individuals (active and inactive with attached species) at site from the local database ordered by seq_num.
      * @param site The site at which to get inactive individuals.
      */
     async getIndividualsFromDatabase(sites: Site[]) {
        let individuals :Individual[] = await this.getStationSpeciesIndividualsFromDatabase(sites);

        if(individuals.length === 0)
            return individuals;

        let [species] = await Promise.all([
            this._speciesService.getSpeciesForIndividuals(individuals)
        ]);

        for (var sp of species) {
            sp.speciesTypes = [];
            sp.speciesProtocols = [];
            sp.speciesSpecificPhenophaseInformation = [];

            for (var individual of individuals) {
                if (individual.species_id === sp.species_id) {
                    // need to deep clone here so that each individual has it's own phenophase info
                    // note method of deep cloning won't preserve date objects which currently isn't an issue
                    //console.log('species = ' + JSON.stringify(sp));
                    individual.species = JSON.parse(JSON.stringify(sp));
                }
            }
        }

        return individuals;
    }

    /**
      * sets the (active) individuals, plants and animals members of the individuals service
      * @param site The site at which to load individuals.
      */
     async loadIndividualsForSite(site: Site) {
        this.plants = [];
        this.animals = [];
        if (!site) {
            this.individuals = [];
        } else {
            this.individuals = (await this.getIndividualsFromDatabase([site]));//.filter(ind => ind.active === 1);
            for (var individual of this.individuals) {
                individual.site = site;
                if (individual.species.kingdom === 'Plantae')
                    this.plants.push(individual);
                if (individual.species.kingdom === 'Animalia')
                    this.animals.push(individual);
            }
        }
    }

    /**
      * attaches speciesProtocols -> protocolPhenphases -> phenophases and sspi -> abundanceCategory -> abundanceValues info to the supplied individuals -> species.
      * @param individuals Array of individuals to get phenophase info for.
      */
    async loadIndividualsPhenophaseInformation(individuals: Individual[]) {
        console.log('individuals length');
        console.log(this.individuals.length);

        if(individuals.length === 0)
            return individuals;

        let [speciesProtocols, sspis] = await Promise.all([
            this._speciesProtocolService.getSpeciesProtocolsForIndividuals(individuals),
            this._speciesSpecificInformation.getSpeciesSpecificPhenophaseInformationForIndividuals(individuals)
        ]);

        for (var individual of individuals) {
            individual.species.speciesTypes = [];
            individual.species.speciesProtocols = [];
            individual.species.speciesSpecificPhenophaseInformation = [];

            for (var speciesProtocol of speciesProtocols) {
                if (speciesProtocol.species_id === individual.species.species_id) {
                    individual.species.speciesProtocols.push(Object.assign({}, speciesProtocol));
                }
            }

            for (var sspi of sspis) {
                if (individual.species.species_id === sspi.species_id) {
                    individual.species.speciesSpecificPhenophaseInformation.push(sspi);
                }
            }
        }
    }

    /**
      * inactivates individuals at site by setting active to 0 and inactivate_comment to 'belongs to inactive station'.
      * @param site The site at which to inactivate individuals.
      */
    async inactivateIndividualsForSite(station_id) {
        let query = `UPDATE ${this.tableName} SET active = 0, inactivate_comment = 'belongs to inactive station' WHERE station_id = ? AND active != 0`;
        let params = [station_id];
        this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
        await this.getDatabase().execSQL(query, params);
    }

    /**
      * activates individual by setting active to 1, inactivate_comment to null, and bumps sync timestamp.
      * @param individual The individual to activate.
      */
    async activateIndividual(individual: Individual) {
        let query = `UPDATE ${this.tableName} SET active = 1, inactivate_comment = NULL, timestamp = ? WHERE station_id = ? and individual_userstr = ?`;
        let params = [new Date().getTime(), individual.station_id, individual.individual_userstr];
        this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
        await this.getDatabase().execSQL(query, params);
    }

    /**
      * remove individual row from local database.
      * @param individual The individual to delete.
      */
    async deleteFromDatabase(individual) {
        let query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        let params = [individual[this.primaryKey]];
        await this.getDatabase().execSQL(query, params);
    };

    /**
      * gets individuals from the local database that belong to the account_id.
      * @param account_id The account_id (person_id from the person table) to get individuals for.
      */
    async getIndividualsForAccount(account_id: number) {
        let query = `SELECT ssi.* FROM station_species_individual ssi 
        LEFT JOIN Stations s ON ssi.station_id = s.station_id 
        WHERE s.person_id = ${account_id}
        GROUP BY ssi.individual_userstr
        ORDER BY ssi.individual_userstr`;
        let results = await this.getDatabase().all(query);
        return results.map(res => <Individual>res);
    }

    /**
      * returns image path (or imageSource for IOS) for the supplied individual.
      * @param individual The individual to get the image path for.
      */
    public getIndividualImage(individual: Individual) {
        let src = '';
        if (individual.file_url && individual.file_url != '') {
            src = individual.file_url;
            src = src.replace('.jpg', '_thumb.jpg');
            src = src.replace('.JPG', '_thumb.JPG');
            src = src.replace('.png', '_thumb.png');
            src = src.replace('.PNG', '_thumb.PNG');
        }
        let folder = fs.knownFolders.documents();
        let imagePath = '';
        if (individual.file_url && individual.file_url != '') {
            // console.log(src.split('/').pop());
            imagePath = fs.path.join(folder.path, src.split('/').pop());
        } else {
            //console.log(fs.path.join(folder.path, `${individual.species.genus}_${individual.species.species}.png`));
            imagePath = fs.path.join(folder.path, `${individual.species.genus}_${individual.species.species}.png`);
        }
        if(!fs.File.exists(imagePath)) {
            imagePath = '~/images/no-image-available.png'
        }
        if (platform.isIOS) {
            return ImageSource.fromFileSync(imagePath);
        } else {
            return imagePath;
        }
    }

    /**
      * POST or PUT supplied individuals to the /individuals npn web services endpoint 
      * @param individuals The individuals to send off.
      * @param operationType Either 'post' or 'put'.
      */
    sendIndividualsToServer (individuals: Individual[], operationType) {
        const getUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + `${this.serviceName}`;
        let payload = individuals.map(individual => {
            Object.keys(individual).forEach((key) => (individual[key] == null) && delete individual[key]);

            if (operationType === 'post') {
                return {
                    client_id: individual.local_id,
                    timestamp: individual.timestamp,
                    insert_object: individual
                }
            } else {
                return {
                    timestamp: individual.timestamp,
                    update_object: individual
                }
            }

        });
        let options = this._oauthService.getRequestOptions(this._peopleService._selectedPerson.userToken);
        console.log('userToken: ' + this._peopleService._selectedPerson.userToken);
        console.log(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        this._databaseService.logSyncInfo(`${operationType.toUpperCase()}: ${getUrl + JSON.stringify(payload)}`);
        if (operationType === 'post') {
            return this.http.post<Individual[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl + payload}`);
                return throwError(err);
            }))
            .toPromise();
        } else if (operationType === 'put') {
            return this.http.put<Individual[]>(getUrl, payload, options)
            .pipe(catchError(err => {
                this._databaseService.logSyncError(`ERROR: ${err} PUT: ${getUrl + payload}`);
                return throwError(err);
            }))
            .toPromise();
        } else {
            console.log('invalid operation type');
        }
    }

    /**
      * updates local database individual and its observations to have individual_id returned from the server after a successful POST.
      * @param local_id The local_id of individual the individual to update
      * @param individual_id the individual_id returned from the server 
      * @returns promise of the updated individual 
      */
    async updateLocalDatabaseIndividualAfterPost(local_id, individual_id) {
        try {
            let query = `UPDATE ${this.tableName} SET individual_id = ?, sync_status = 1 WHERE local_id = ?`;
            let params = [individual_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }

        try {
            let query2 = `UPDATE observations SET individual_id = ? WHERE individual_local_id = ?`;
            let params2 = [individual_id, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query2} VALUES: ${params2}`);
            await this.getDatabase().execSQL(query2, params2)
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }

        let individualWithUpdatedId = await this.getFromDatabaseWhere<Individual>('individual_id', individual_id);
        return individualWithUpdatedId[0];
    };

     /**
      * updates local database individual setting sync_status to 0 after a failed POST.
      * @param local_id The local_id of individual the individual to update
      */
     async updateLocalDatabaseIndividualAfterFailedPost(local_id, serverStatus) {
        try {
            let query = `UPDATE ${this.tableName} SET sync_status = 0, sync_message = ? WHERE local_id = ?`;
            let params = [serverStatus, local_id];
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };

    /**
      * updates local database individual to mirror individual returned from the server after a successful PUT.
      * @param objectToUpdate the update_object part of a returned object from the server after a successful put
      */
    async updateLocalDatabaseIndividualAfterPut(objectToUpdate) {
        try {
            let query = `UPDATE ${this.tableName} SET ${this.serverTableColumns.map((el) => `${el} = ?`).join(',')}, sync_status = 1 WHERE individual_id = ?`;
            let params = this.serverTableColumns.map((el) => objectToUpdate[el]).concat(objectToUpdate.individual_id);
            this._databaseService.logDbInfo(`QUERY: ${query} VALUES: ${params}`);
            await this.getDatabase().execSQL(query, params);
        } catch(err) {
            console.log('ERROR: ' + err);
            this._databaseService.logDbError(err);
        }
    };

    /**
      * sends off new individuals to the server via POST.
      * If POST is sucessfull, updates the local database appropriately. 
      * Otherwise, its possible that the server already has an individual with the same identity, 
      * in which case the POST will be rejected, and this function will append to an update instead array which is returned.
      * @param postIndividuals an array of new individuals to sync to the server
      * @returns promise of indiviudals that the server already has and thus needs to be PUT instead
      */
    async insertNewIndividuals(postIndividuals) {
        // this represents individuals that weren't inserted because they already exist on the server
        let updateInstead = [];
        if (postIndividuals && postIndividuals.length > 0) {
            let returnedServerIndividuals = await this.sendIndividualsToServer(postIndividuals, 'post');
            await this.getDatabase().execSQL('begin transaction');
            for (var serverObject of returnedServerIndividuals) {
                let individual_id = serverObject.insert_object['individual_id'];
                if (serverObject.inserted) {
                    console.log(`the individual ${individual_id} was inserted on the server`);
                    let result = await this.updateLocalDatabaseIndividualAfterPost(serverObject.client_id, individual_id);
                } else {
                    console.log(`the individual wasnt inserted on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the individual wasnt inserted on the server. status: ${serverObject.status}`);
                    // in this case we update the local dbs individual_id to match what the server returned and add it
                    // to the put array so that the server can update instead of insert
                    if (serverObject.status === 'individual already exists') {
                        let localIndividualWithUpdatedId = await this.updateLocalDatabaseIndividualAfterPost(serverObject.client_id, individual_id);
                        updateInstead.push(localIndividualWithUpdatedId);
                    } else {
                        // set syncStatus to 0 (will cause it to try and sync again next time since timestamp is now too low)
                        await this.updateLocalDatabaseIndividualAfterFailedPost(individual_id, serverObject.status);
                    }
                }
            }
            await this.getDatabase().execSQL('commit');
        }
        return updateInstead;
    }

    /**
      * sends off edited individuals to the server via PUT.
      * If PUT is sucessfull, updates the local database appropriately. 
      * Otherwise, its possible that the server doesn't know about the individual with the same identity, 
      * in which case the PUT will be rejected, and this function will append to a post instead array which is returned.
      * @param putIndividuals an array of edited individuals to sync to the server
      * @returns promise of indiviudals that the server didn't know about and thus needs to be POST instead
      */
    async updateEditedIndividuals(putIndividuals) {
        let insertInstead = [];
        if (putIndividuals && putIndividuals.length > 0) {
            let returnedServerIndividuals = await this.sendIndividualsToServer(putIndividuals, 'put');
            await this.getDatabase().execSQL('begin transaction');
            for (var serverObject of returnedServerIndividuals) {
                if (serverObject.updated) {
                    console.log('the individual was updated on the server');
                    let result = await this.updateLocalDatabaseIndividualAfterPut(serverObject.update_object);
                } else {
                    console.log(`the individual wasnt updated on the server. status: ${serverObject.status}`);
                    this._databaseService.logSyncError(`the individual wasnt updated on the server. status: ${serverObject.status}`);
                    if (serverObject.status === "individual doesn't exists") {
                        insertInstead.push(serverObject.update_object);
                    } else if(serverObject.status === "server individual was newer than client update") {
                        let result = await this.updateLocalDatabaseIndividualAfterPut(serverObject.update_object);
                    } else {
                        // todo nothing now
                    }
                }
            }
            await this.getDatabase().execSQL('commit');
        }
        return insertInstead;
    }

    // get all rows from local db with timestamp greater than last sync time
    async getUnsyncedIndividualsFromDatabase<T> (lastSyncTimestamp): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE timestamp > ${lastSyncTimestamp} OR sync_status = 0 OR individual_id IS NULL`;
        return (await this.getDatabase().all(query)).map(row => <T[]> row);
    };

    /**
      * gets all individuals from the local database that were added or modified since the most recent sync.
      * Then syncs those individuals to the server.
      * @param lastSyncTimestamp timestamp of the most recent sync
      * @returns promise of synced indiviudals
      */
    async syncIndividuals(lastSyncTimestamp: Number) {
        let unsyncedIndividuals: Individual[] = await this.getUnsyncedIndividualsFromDatabase<Individual> (lastSyncTimestamp);
        let postIndividuals = unsyncedIndividuals.filter(ind => ind.individual_id == null);
        let putIndividuals = unsyncedIndividuals.filter(obs => obs.individual_id != null);

        console.log('post count: ' + postIndividuals.length);
        console.log('put count: ' + putIndividuals.length);

        // try to insert new individuals via post; if already exists on the server we add to puts array to update instead
        if (postIndividuals && postIndividuals.length > 0) {
            let updateInstead = await this.insertNewIndividuals(postIndividuals);
            putIndividuals = putIndividuals.concat(updateInstead);
        }

        // try to update modified indviduals via put; if doesn't exist on the server we add to the insertInstead to post
        let observationsSyncErrors = [];
        if (putIndividuals && putIndividuals.length > 0) {
            let insertInstead = await this.updateEditedIndividuals(putIndividuals);
            observationsSyncErrors = await this.insertNewIndividuals(insertInstead);
        }
        return unsyncedIndividuals;
    }

    /**
      * updates local database with any new/edited server invividuals belonging to the supplied sites.
      * Note this function doesn't send off any individuals.
      * @param sites the sites for which to get individuals from the server
      * @returns promise of the individuals returned from the server
      */
    async syncTable<Individual>(sites: Site[]) {

        let station_ids = sites.map((site) => site['station_id']).join();

        let [serverIndividuals, localIndividuals ] = await Promise.all([
            sites.length > 0 ? this.getFromServerForParents<Individual>(sites, 'station_id', 'station_id') : [],
            this.getFromDatabaseWhere<Individual>('station_id', station_ids)
        ]);

        await this.startTransaction();
        // remove Individuals from database that weren't returned from the server
        for(var localIndividual of localIndividuals) {
            if (!serverIndividuals.some((serverIndividual) => serverIndividual[this.primaryKey] == localIndividual[this.primaryKey])) {
                await this.deleteFromDatabase(localIndividual);
                //also delete observations for deleted individuals
                await this._observationsService.deleteObservationsForIndividual(localIndividual[this.primaryKey]);
            }
        }
        await this.commitTransaction();

        // insert or update each serverIndividual in the database
        await this.startTransaction();
        for (var serverIndividual of serverIndividuals) {
            if (localIndividuals.some((localIndividual) => serverIndividual[this.primaryKey] == localIndividual[this.primaryKey])) {
                await this.updateInDatabase(serverIndividual);
            }
            else {
                await this.insertIntoDatabase(serverIndividual);
            }
        }
        await this.commitTransaction();

        await this.startTransaction();
        // make individuals inactive, if their site has active = 0
        for (var site of sites) {
            if(site.active == 0) {
                await this.inactivateIndividualsForSite(site.station_id);
            }
        }
        await this.commitTransaction();

        await this.startTransaction();
        // delete observations for inactive individuals
        let inactiveIndividuals = await this.getFromDatabaseWhere<Individual>('active', 0);
        for (var ind of inactiveIndividuals) {
            await this._observationsService.deleteObservationsForIndividual(ind[this.primaryKey]);
        }
        await this.commitTransaction();
        
        return serverIndividuals;
    }

}