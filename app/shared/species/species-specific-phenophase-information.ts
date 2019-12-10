import {AbundanceCategory} from "../phenophases/abundance-category";

export interface SpeciesSpecificPhenophaseInformation {
    species_specific_phenophase_id: number;
    phenophase_id: number;
    species_id: number;
    additional_definition: string;
    active: number;
    effective_datetime: string;
    deactivation_datetime: string;
    multimedia_uri: string;
    multimedia_credit: string;
    abundance_category: number;
    extent_min: number;
    extent_max: number;
    deleted: boolean;
    //primaryKey: number;
    abundanceCategories: AbundanceCategory[];
}