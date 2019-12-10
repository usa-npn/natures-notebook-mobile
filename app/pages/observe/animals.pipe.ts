import { Pipe, PipeTransform } from '@angular/core';
import { Individual } from '../../shared/individuals/individual';

@Pipe({ name: 'animalsPipe'})
export class AnimalsPipe implements PipeTransform {
    transform(allIndividuals: Individual[]) {
        return allIndividuals.filter(individual => {
            return individual.species.kingdom === 'Animalia';
        });
    }
}