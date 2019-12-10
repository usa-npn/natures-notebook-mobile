import { Pipe, PipeTransform } from '@angular/core';
import {Species} from "../../../shared/species/species";
import {SpeciesType} from "../../../shared/species/species_type";

@Pipe({ name: 'speciesPipe'})
export class SpeciesPipe implements PipeTransform {
    transform(allSpecies: Species[], searchText: string, activeTab: string) {
        return allSpecies.filter(sp => {
            if (sp.animalAlreadyAdded) {
                return false;
            }
            if (!searchText) {
                return true;
            }
            if (activeTab === 'scientific') {
                return sp.species.toLowerCase().includes(searchText.toLowerCase())
                    || sp.genus.toLowerCase().includes(searchText.toLowerCase());
            }
            else {
                return sp.common_name.toLowerCase().includes(searchText.toLowerCase());
            }
        });
    }
}