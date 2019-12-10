import {AbundanceCategoryAbundanceValue} from "./abundance-category-abundance-value";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, from} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {AbundanceCategory} from "./abundance-category";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class AbundanceCategoriesAbundanceValuesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('abundance_category_id', 'integer');
        this.sqLiteTypes.set('abundance_value_id', 'integer');
        this.sqLiteTypes.set('seq_num', 'text');
    }

    serviceName = 'abundance_categories_abundance_values';
    tableName = 'abundance_categories_abundance_values';
    primaryKey = 'abundance_category_id';

    serverTableColumns = [
        'abundance_category_id',
        'abundance_value_id',
        'seq_num'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    // hashes abundance_category_id to array of AbundanceCategoryAbundanceValues
    public abundanceCategoriesAbundanceValuesMap = new Map<number, AbundanceCategoryAbundanceValue[]>();

    public async loadAbundanceCategoriesAbundanceValues() {
        (<AbundanceCategoryAbundanceValue[]> await this.getFromDatabase()).forEach((acav => {
            if(this.abundanceCategoriesAbundanceValuesMap.has(acav.abundance_category_id)) {
                this.abundanceCategoriesAbundanceValuesMap.set(acav.abundance_category_id,
                    this.abundanceCategoriesAbundanceValuesMap.get(acav.abundance_category_id).concat(acav));
            } else {
                this.abundanceCategoriesAbundanceValuesMap.set(acav.abundance_category_id, [acav]);
            }
        }));
        return this.abundanceCategoriesAbundanceValuesMap;
    }

    public getAbundanceCategoriesAbundanceValuesForAbundanceCateogries(abundanceCategories: AbundanceCategory[]) {
        let query: string;
        if (abundanceCategories.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE abundance_category_id = ${abundanceCategories[0].abundance_category_id} ORDER BY seq_num`;

        } else {
            let ids = abundanceCategories.map((obj) => obj.abundance_category_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE abundance_category_id IN (${ids}) ORDER BY seq_num`
        }
        return from(this.getDatabase().all(query)).pipe(
            map(res => <AbundanceCategoryAbundanceValue[]> res),
            catchError(this.handleErrors)
        ).toPromise();
    }
}