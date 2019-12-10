import {ProtocolPhenophase} from "./protocol-phenophase";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {SpeciesProtocol} from "../species/species_protocol";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class ProtocolPhenophasesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('protocol_id', 'integer');
        this.sqLiteTypes.set('phenophase_id', 'integer');
        this.sqLiteTypes.set('seq_num', 'integer');
        this.sqLiteTypes.set('active', 'integer');
    }

    serviceName = 'protocol_phenophases';
    tableName = 'protocol_phenophases';
    primaryKey = 'protocol_id';

    serverTableColumns = [
        'protocol_id',
        'phenophase_id',
        'seq_num',
        'active'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public async getProtocolPhenophasesForSpeciesProtocol(speciesProtocol: SpeciesProtocol[]) {
        let query: string;
        if (speciesProtocol.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE protocol_id = ${speciesProtocol[0].protocol_id}`;

        } else {
            let ids = speciesProtocol.map((obj) => obj.protocol_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE protocol_id IN (${ids})`
        }
        let results = await this.getDatabase().all(query);
        return results.map(res => <ProtocolPhenophase[]> res);
    }

    public async getProtocolPhenophaseCounts() {
        let query = `SELECT protocol_id, COUNT(*) AS num_phenophases FROM ${this.tableName} GROUP BY protocol_id`;
        let results = await this.getDatabase().all(query);
        let hashmap = {};
        results.forEach(row => {
            hashmap[row.protocol_id] = row.num_phenophases;
        });
        return hashmap;
    }
}
