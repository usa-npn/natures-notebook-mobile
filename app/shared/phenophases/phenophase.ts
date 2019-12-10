import {PhenophaseDefinition} from "./phenophase-definition";
import {AbundanceValue} from "./abundance-value";
import {SpeciesSpecificPhenophaseInformation} from "../species/species-specific-phenophase-information";
import {AbundanceCategory} from "./abundance-category";

export class Phenophase {
    phenophase_id: number;
    short_name: string;
    description: string;
    comment: string;
    color: string;
    preferred_action: string;
    deleted: boolean;
    phenophaseDefinition: PhenophaseDefinition;
    phenophaseDefinitions: PhenophaseDefinition[];

    protocol_id: number;
    seq_num: number;
    yesSelected: boolean;
    noSelected: boolean;
    notSureSelected: boolean;
    abundanceValue: AbundanceValue;

    intensity: number;
    speciesSpecificPhenophaseInformation: SpeciesSpecificPhenophaseInformation[];
    abundanceCategories: AbundanceCategory[];
    abundanceValues: AbundanceValue[];

    extent_min: number;
    extent_max: number;
}
