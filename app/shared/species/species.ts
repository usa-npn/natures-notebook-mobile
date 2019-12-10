import {SpeciesProtocol} from "./species_protocol";
import {SpeciesSpecificPhenophaseInformation} from "./species-specific-phenophase-information";
import {SpeciesType} from "./species_type";

export class Species {
    species_id: number;
    common_name: string;
    kingdom: string;
    genus: string;
    species: string;
    itis_taxonomic_sn: string;
    active: number;
    about_url: string;
    cloned: number;
    usda_symbol: string;
    date_added: string;
    functional_type: string;
    deleted: boolean;
    speciesProtocols: SpeciesProtocol[];
    speciesSpecificPhenophaseInformation: SpeciesSpecificPhenophaseInformation[];
    speciesTypes: SpeciesType[];

    animalAlreadyAdded: boolean;
    numIndividualsAtSite: number;
}