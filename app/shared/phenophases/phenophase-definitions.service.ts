import {PhenophaseDefinition} from "./phenophase-definition";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, from} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {Phenophase} from "./phenophase";
import { map, catchError } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class PhenophaseDefinitionsService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('definition_id', 'integer primary key');
        this.sqLiteTypes.set('phenophase_id', 'integer');
        this.sqLiteTypes.set('phenophase_name', 'text');
        this.sqLiteTypes.set('definition', 'text');
        this.sqLiteTypes.set('start_date', 'text');
        this.sqLiteTypes.set('end_date', 'text');
        this.sqLiteTypes.set('dataset_id', 'integer');
        this.sqLiteTypes.set('comments', 'text');
    }

    serviceName = 'phenophase_definitions';
    tableName = 'phenophase_definitions';
    primaryKey = 'definition_id';

    serverTableColumns = [
        'definition_id',
        'phenophase_id',
        'phenophase_name',
        'definition',
        'start_date',
        'end_date',
        'dataset_id',
        'comments'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    getPhenophaseDefinitionsForPhenophases(phenophases: Phenophase[]) {
        let query: string;
        if (phenophases.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE phenophase_id = ${phenophases[0].phenophase_id}`;

        } else {
            let ids = phenophases.map((obj) => obj.phenophase_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE phenophase_id IN (${ids})`
        }
        return from(this.getDatabase().all(query)).pipe(
            map(res => <PhenophaseDefinition[]> res),
            catchError(this.handleErrors)
        ).toPromise();
    }

}