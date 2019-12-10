import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {Species} from "./species";
import {Individual} from "../individuals/individual";
import {PhenophasesService} from "../phenophases/phenophases.service";
import {ProtocolPhenophasesService} from "../phenophases/protocol-phenophases.service";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class SpeciesSpeciesTypesService extends GenericTableService{

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _phenophasesService: PhenophasesService,
                private _protocolPhenophasesService: ProtocolPhenophasesService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('species_id', 'integer');
        this.sqLiteTypes.set('species_type_id', 'integer');
    }

    serviceName = 'species_species_types';
    tableName = 'species_species_types';
    primaryKey = 'species_id';

    serverTableColumns = [
        'species_id',
        'species_type_id'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    // private async getRawSpeciesProtocolsForIndividuals(individuals: Individual[]) {
    //     let query: string;
    //     if (individuals.length === 1) {
    //         query = `SELECT * FROM ${this.tableName} WHERE species_id = ${individuals[0].species_id}`;
    //
    //     } else {
    //         let ids = individuals.map((individual) => individual.species_id).join();
    //         query = `SELECT * FROM ${this.tableName} WHERE species_id IN (${ids})`
    //     }
    //     let results = await this.getDatabase().all(query);
    //     return results.map(res => <SpeciesProtocol[]> res);
    // }
    //
    //
    // async getSpeciesProtocolsForIndividuals(individuals: Individual[]) {
    //     let speciesProtocols:SpeciesProtocol[] = await this.getRawSpeciesProtocolsForIndividuals(individuals);
    //     let protocolPhenophases = await this._protocolPhenophasesService.getProtocolPhenophasesForSpeciesProtocol(speciesProtocols);
    //     let phenophases = await this._phenophasesService.getPhenophasesForProtocolPhenophases(protocolPhenophases);
    //
    //     for (var protocolPhenophase of protocolPhenophases) {
    //         for (var phenophase of phenophases) {
    //             if(protocolPhenophase.phenophase_id === phenophase.phenophase_id) {
    //                 protocolPhenophase.phenophase = Object.assign({}, phenophase);
    //             }
    //         }
    //     }
    //
    //     for(var speciesProtocol of speciesProtocols) {
    //         speciesProtocol.protocolPhenophases = [];
    //         for(var protocolPhenophase of protocolPhenophases) {
    //             if (speciesProtocol.protocol_id === protocolPhenophase.protocol_id) {
    //                 speciesProtocol.protocolPhenophases.push(protocolPhenophase)
    //             }
    //         }
    //     }
    //     return speciesProtocols;
    // }

}