import {Phenophase} from "./phenophase";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {SpeciesProtocol} from "../species/species_protocol";
import {ProtocolPhenophasesService} from "./protocol-phenophases.service";
import {ProtocolPhenophase} from "./protocol-phenophase";
import {PhenophaseDefinitionsService} from "./phenophase-definitions.service";
import { PhenophaseDefinition } from "./phenophase-definition";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class PhenophasesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _protocolPhenophasesService: ProtocolPhenophasesService,
                private _phenophaseDefinitionsService: PhenophaseDefinitionsService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('phenophase_id', 'integer primary key');
        this.sqLiteTypes.set('short_name', 'text');
        this.sqLiteTypes.set('description', 'text');
        this.sqLiteTypes.set('comment', 'text');
        this.sqLiteTypes.set('color', 'text');
        this.sqLiteTypes.set('preferred_action', 'text');
        this.sqLiteTypes.set('comments', 'text');
    }

    serviceName = 'phenophases';
    tableName = 'phenophases';
    primaryKey = 'phenophase_id';

    serverTableColumns = [
        'phenophase_id',
        'short_name',
        'description',
        'comment',
        'color',
        'preferred_action'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    private async getRawPhenophasesForProtocolPhenophases(protocolPhenophases: ProtocolPhenophase[]) {
        let query: string;
        if (protocolPhenophases.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE phenophase_id = ${protocolPhenophases[0].phenophase_id}`;

        } else {
            let ids = protocolPhenophases.map((obj) => obj.phenophase_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE phenophase_id IN (${ids})`
        }
        let results = await this.getDatabase().all(query)
        return results.map(res => <Phenophase[]> res);
    }

    async getPhenophasesForProtocolPhenophases(protocolPhenophases: ProtocolPhenophase[]) {
        let phenophases: Phenophase[] = await this.getRawPhenophasesForProtocolPhenophases(protocolPhenophases);
        let phenophaseDefinitions = await this._phenophaseDefinitionsService.getPhenophaseDefinitionsForPhenophases(phenophases);
        for (var phenophase of phenophases) {
            phenophase.phenophaseDefinitions = [];
            for (var phenophaseDefinition of phenophaseDefinitions) {
                if (phenophase.phenophase_id === phenophaseDefinition.phenophase_id) {
                    phenophase.phenophaseDefinitions.push(phenophaseDefinition);
                }
            }
        }
        return phenophases;
    }

    public getActivePhenophaseDefinition(phenophase, selectedDate): PhenophaseDefinition {
        return phenophase.phenophaseDefinitions.filter((phenophaseDefinition: PhenophaseDefinition) => {
            const startDate = phenophaseDefinition.start_date ? new Date(phenophaseDefinition.start_date) : null;
            const endDate = phenophaseDefinition.end_date ? new Date(phenophaseDefinition.end_date) : null;
            if (phenophaseDefinition.dataset_id != null) {
                return false;
            }
            else if (!endDate && startDate.getTime() < selectedDate.getTime()) {
                return true;
            }
            else if (startDate.getTime() < selectedDate.getTime() && endDate.getTime() > selectedDate.getTime()) {
                return true;
            }
            else {
                return false;
            }
        });
    }
}
