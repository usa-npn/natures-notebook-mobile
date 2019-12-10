import { Pipe, PipeTransform } from '@angular/core';
import { Site } from '../../shared/sites/site';
import {Individual} from "../../shared/individuals/individual";

@Pipe({ name: 'syncStatusObservationPipe'})
export class SyncStatusObservationPipe implements PipeTransform {
    transform(observations, selectedSite: Site, selectedIndividual: Individual, sortDateDesc: boolean) {

        return observations.filter(obs => {
            if (selectedSite.station_name === 'All Sites' && selectedIndividual.individual_userstr === 'All Plants & Animals') {
                return true;
            } else if (selectedSite.station_name === 'All Sites') {
                return obs.individual_id === selectedIndividual.individual_id;
            } else if(selectedIndividual.individual_userstr === 'All Plants & Animals') {
                return obs.station_id === selectedSite.station_id;
            } else {
                return obs.individual_id === selectedIndividual.individual_id && obs.station_id === selectedSite.station_id;
            }
        }).sort((a, b) => {
            // used to reverse sort output
            let sortMult = -1;
            if (sortDateDesc) {
                sortMult = 1;
            }
            let date1 = new Date((<any>a).observation_date).getTime();
            let date2 = new Date((<any>b).observation_date).getTime();

            if (date1 < date2) {
                return -1 * sortMult;
            } else if(date1 > date2) {
                return 1 * sortMult;
            } else if((<any>a).station_name < (<any>b).station_name) {
                return -1 * sortMult;
            } else if((<any>a).station_name > (<any>b).station_name) {
                return 1 * sortMult;
            } else if((<any>a).individual_userstr < (<any>b).individual_userstr) {
                return -1 * sortMult;
            } else if((<any>a).individual_userstr > (<any>b).individual_userstr) {
                return 1 * sortMult;
            } else {
                return 0;
            }
        });
    }
}