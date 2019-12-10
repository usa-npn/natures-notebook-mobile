import { Pipe, PipeTransform } from '@angular/core';
import { Site } from '../../shared/sites/site';
import { Network } from '../../shared/networks/network';

@Pipe({ name: 'sitesPipe'})
export class SitesPipe implements PipeTransform {
    transform(allSites: Site[], selectedNetwork: Network) {
        return allSites.filter(site => {
            if (selectedNetwork.network_id != -1) {
                return selectedNetwork.network_id === site.network_id;
            } else {
                return !site.network_id;
            }
        });
    }
}