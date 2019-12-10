import {Species} from "./species";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {Individual} from "../individuals/individual";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class SpeciesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('species_id', 'integer primary key');
        this.sqLiteTypes.set('common_name', 'text');
        this.sqLiteTypes.set('kingdom', 'text');
        this.sqLiteTypes.set('genus', 'text');
        this.sqLiteTypes.set('species', 'text');
        this.sqLiteTypes.set('itis_taxonomic_sn', 'text');
        this.sqLiteTypes.set('active', 'integer');
        this.sqLiteTypes.set('about_url', 'text');
        this.sqLiteTypes.set('cloned', 'integer');
        this.sqLiteTypes.set('usda_symbol', 'text');
        this.sqLiteTypes.set('date_added', 'text');
        this.sqLiteTypes.set('functional_type', 'text');
    }

    public species: Species[];

    serviceName = 'species';
    tableName = 'species';
    primaryKey = 'species_id';

    serverTableColumns = [
        'species_id',
        'common_name',
        'kingdom',
        'genus',
        'species',
        'itis_taxonomic_sn',
        'active',
        'about_url',
        'cloned',
        'usda_symbol',
        'date_added',
        'functional_type'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    async getSpeciesForIndividuals(individuals: Individual[]) {
        let query: string;
        if (individuals.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE species_id = ${individuals[0].species_id}`;

        } else {
            let ids = individuals.map((individual) => individual.species_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE species_id IN (${ids})`
        }
        let results = await this.getDatabase().all(query);
        return results.map(res => <Species[]> res)
    }

}