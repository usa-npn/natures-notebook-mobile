import {AbundanceCategory} from "./abundance-category";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {SpeciesSpecificPhenophaseInformation} from "../species/species-specific-phenophase-information";
import {AbundanceValuesService} from "./abundance-values.service";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class AbundanceCategoriesService extends GenericTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _abundanceValuesService: AbundanceValuesService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('abundance_category_id', 'integer primary key');
        this.sqLiteTypes.set('name', 'text');
        this.sqLiteTypes.set('description', 'text');
    }

    serviceName = 'abundance_categories';
    tableName = 'abundance_categories';
    primaryKey = 'abundance_category_id';

    serverTableColumns = [
        'abundance_category_id',
        'name',
        'description'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public abundanceCategoriesMap = new Map<number, AbundanceCategory>();

    public async loadAbundanceCategories() {
        (<AbundanceCategory[]> await this.getFromDatabase()).forEach((ac => {
            this.abundanceCategoriesMap.set(ac.abundance_category_id, ac);
        }));
        return this.abundanceCategoriesMap;
    }

    public async getAbundanceCategoriesForSpeciesSpecificPhenophaseInformation(sspis: SpeciesSpecificPhenophaseInformation[]) {
        let query: string;
        if (sspis.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE abundance_category_id = ${sspis[0].abundance_category}`;

        } else {
            // filter(Boolean) is to remove sspi.abundance_category entries that are empty
            let ids = sspis.map((obj) => obj.abundance_category).filter(Boolean).join();
            query = `SELECT * FROM ${this.tableName} WHERE abundance_category_id IN (${ids})`
        }
        let results = await this.getDatabase().all(query);
        return results.map(res => <AbundanceCategory[]> res);
    }
}