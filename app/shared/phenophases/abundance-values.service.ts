import {AbundanceValue} from "./abundance-value";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, from} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {AbundanceCategory} from "./abundance-category";
import {AbundanceCategoriesAbundanceValuesService} from "./abundance-categories-abundance-values.service";
import {AbundanceCategoryAbundanceValue} from "./abundance-category-abundance-value";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class AbundanceValuesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _abundanceCategoriesAbundanceValuesService: AbundanceCategoriesAbundanceValuesService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('abundance_value_id', 'integer primary key');
        this.sqLiteTypes.set('abundance_value', 'text');
        this.sqLiteTypes.set('short_name', 'text');
    }

    serviceName = 'abundance_values';
    tableName = 'abundance_values';
    primaryKey = 'abundance_value_id';

    serverTableColumns = [
        'abundance_value_id',
        'abundance_value',
        'short_name'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public abundanceValuesMap = new Map<number, AbundanceValue>();

    public async loadAbundanceValues() {
        (<AbundanceValue[]> await this.getFromDatabase()).forEach((av => {
            this.abundanceValuesMap.set(av.abundance_value_id, av);
        }));
        return this.abundanceValuesMap;
    }

    public async getAbundanceValuesForAbundanceCategories(abundanceCategoriesAbundanceValues: AbundanceCategoryAbundanceValue[]) {

        let query: string;
        if (abundanceCategoriesAbundanceValues.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE abundance_value_id = ${abundanceCategoriesAbundanceValues[0].abundance_value_id}`;

        } else {
            let ids = abundanceCategoriesAbundanceValues.map((obj) => obj.abundance_value_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE abundance_value_id IN (${ids})`
        }
        return from(this.getDatabase().all(query)).pipe(
            map(res => <AbundanceValue[]> res),
            catchError(this.handleErrors)
        ).toPromise();
    }
}