import {SpeciesSpecificPhenophaseInformation} from "./species-specific-phenophase-information";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, from} from "rxjs";
import {GenericTableService} from "../generic-table-service";
import {Individual} from "../individuals/individual";
import {AbundanceCategoriesService} from "../phenophases/abundance-categories.service";
import {AbundanceValuesService} from "../phenophases/abundance-values.service";
import {AbundanceCategoriesAbundanceValuesService} from "../phenophases/abundance-categories-abundance-values.service";
import {Phenophase} from "../phenophases/phenophase";
import {AbundanceValue} from "../phenophases/abundance-value";
import {AbundanceCategory} from "../phenophases/abundance-category";
import { catchError, map } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class SpeciesSpecificPhenophaseInformationService extends GenericTableService{

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                private _abundanceCategoriesService: AbundanceCategoriesService,
                private _abundanceValuesService: AbundanceValuesService,
                private _abundanceCategoriesAbundanceValuesService: AbundanceCategoriesAbundanceValuesService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('species_specific_phenophase_id', 'integer primary key');
        this.sqLiteTypes.set('phenophase_id', 'integer');
        this.sqLiteTypes.set('species_id', 'integer');
        this.sqLiteTypes.set('additional_definition', 'integer');
        this.sqLiteTypes.set('active', 'integer');
        this.sqLiteTypes.set('effective_datetime', 'text');
        this.sqLiteTypes.set('deactivation_datetime', 'text');
        this.sqLiteTypes.set('multimedia_uri', 'text');
        this.sqLiteTypes.set('multimedia_credit', 'text');
        this.sqLiteTypes.set('abundance_category', 'integer');
        this.sqLiteTypes.set('extent_min', 'integer');
        this.sqLiteTypes.set('extent_max', 'integer');
    }

    serviceName = 'species_specific_phenophase_information';
    tableName = 'species_specific_phenophase_information';
    primaryKey = 'species_specific_phenophase_id';

    serverTableColumns = [
        'species_specific_phenophase_id',
        'phenophase_id',
        'species_id',
        'additional_definition',
        'active',
        'effective_datetime',
        'deactivation_datetime',
        'multimedia_uri',
        'multimedia_credit',
        'abundance_category',
        'extent_min',
        'extent_max'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public sspiMapInitialized = false;

    individualToSspisMap = new Map<number, SpeciesSpecificPhenophaseInformation[]>();

    private getRawSpeciesSpecificPhenophaseInformationForIndividuals(individuals: Individual[]) {
        let query: string;
        if (individuals.length === 0) {
            query = `SELECT * FROM ${this.tableName}`;

        } else if (individuals.length === 1) {
            query = `SELECT * FROM ${this.tableName} WHERE species_id = ${individuals[0].species_id}`;

        } else {
            let ids = individuals.map((individual) => individual.species_id).join();
            query = `SELECT * FROM ${this.tableName} WHERE species_id IN (${ids})`
        }
        return from(this.getDatabase().all(query)).pipe(
            map(res => <SpeciesSpecificPhenophaseInformation[]> res),
            catchError(this.handleErrors)
            ).toPromise();
    }

    async getSpeciesSpecificPhenophaseInformationForIndividuals(individuals: Individual[]) {
        let sspis:SpeciesSpecificPhenophaseInformation[] = await this.getRawSpeciesSpecificPhenophaseInformationForIndividuals(individuals);
        let abundanceCategories = await this._abundanceCategoriesService.getAbundanceCategoriesForSpeciesSpecificPhenophaseInformation(sspis);
        let abundanceCategoriesAbundanceValues = await this._abundanceCategoriesAbundanceValuesService.getAbundanceCategoriesAbundanceValuesForAbundanceCateogries(abundanceCategories);
        let abundanceValues = await this._abundanceValuesService.getAbundanceValuesForAbundanceCategories(abundanceCategoriesAbundanceValues);

        for (var abundanceCategory of abundanceCategories) {
            abundanceCategory.abundanceValues = [];
            for (var abundanceCategoryAbundanceValue of abundanceCategoriesAbundanceValues) {
                if (abundanceCategory.abundance_category_id === abundanceCategoryAbundanceValue.abundance_category_id) {
                    for (var abundanceValue of abundanceValues) {
                        if (abundanceCategoryAbundanceValue.abundance_value_id === abundanceValue.abundance_value_id) {
                            abundanceCategory.abundanceValues.push(abundanceValue);
                        }
                    }
                }
            }
        }

        for (var sspi of sspis) {
            sspi.abundanceCategories = [];
            for (var abundanceCategory of abundanceCategories) {
                if (sspi.abundance_category === abundanceCategory.abundance_category_id) {
                    sspi.abundanceCategories.push(abundanceCategory);
                }
            }
        }
        return sspis;
    }

    private activeDate(startDate: Date, endDate: Date, date: Date): boolean {
        if(!startDate) {
            return false;
        }
        if (!endDate && startDate.getTime() < date.getTime()) {
            return true;
        }
        else if (startDate.getTime() < date.getTime() && endDate.getTime() > date.getTime()) {
            return true;
        }
        else {
            return false;
        }
    }

    public getSpeciesSpecificPhenophaseInformationForDate(individual: Individual, phenophase: Phenophase, date:Date): SpeciesSpecificPhenophaseInformation[] {
        return individual.species.speciesSpecificPhenophaseInformation.filter(sspi => {
            return sspi.phenophase_id === phenophase.phenophase_id;
        }).filter((sspi: SpeciesSpecificPhenophaseInformation) => {
            const startDate = sspi.effective_datetime ? new Date(sspi.effective_datetime) : null;
            const endDate = sspi.deactivation_datetime ? new Date(sspi.deactivation_datetime) : null;
            return this.activeDate(startDate, endDate, date);
        });
    }

}