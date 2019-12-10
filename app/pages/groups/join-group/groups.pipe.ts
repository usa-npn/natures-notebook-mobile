import { Pipe, PipeTransform } from '@angular/core';
import {Network} from "../../../shared/networks/network";
import {NetworkHierarchy} from "../../../shared/networks/network-hierarchy";

@Pipe({ name: 'groupsPipe'})
export class GroupsPipe implements PipeTransform {
    transform(allGroups: NetworkHierarchy[], alreadyJoinedGroupIds: number[]) {
        if (!allGroups) {
            return allGroups.filter(group => {
                return !alreadyJoinedGroupIds.some((joinedGroupId) => joinedGroupId === group.network_id);
            });
            //return false;
        }
        return allGroups.filter(group => {
            return !group.hidden && !alreadyJoinedGroupIds.some((joinedGroupId) => joinedGroupId === group.network_id);
        });
    }
}
// export class GroupsPipe implements PipeTransform {
//     transform(allGroups: NetworkHierarchy[], searchText: string) {
//         let searchString = searchText.toLowerCase();
//         return allGroups.filter(group => {
//             if (group.network_name.toLowerCase().includes(searchString)) {
//                 return true;
//             } else if(group.secondary_network) {
//                 for (let secondaryNetwork of group.secondary_network) {
//                     if(secondaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                         return true;
//                     }
//                     if(secondaryNetwork.tertiary_network) {
//                         for (let tertiaryNetwork of secondaryNetwork.tertiary_network) {
//                             if(tertiaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                                 return true;
//                             }
//                             if(tertiaryNetwork.quaternary_network) {
//                                 for (let quaternaryNetwork of tertiaryNetwork.quaternary_network) {
//                                     if (quaternaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                                         return true;
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             } else if(group.tertiary_network) {
//                 for (let tertiaryNetwork of group.tertiary_network) {
//                     if(tertiaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                         return true;
//                     }
//                     if(tertiaryNetwork.quaternary_network) {
//                         for (let quaternaryNetwork of tertiaryNetwork.quaternary_network) {
//                             if (quaternaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                                 return true;
//                             }
//                         }
//                     }
//                 }
//
//             } else if(group.quaternary_network) {
//                 for (let quaternaryNetwork of group.quaternary_network) {
//                     if(quaternaryNetwork.network_name.toLowerCase().includes(searchString)) {
//                         return true;
//                     }
//                 }
//             } else {
//                 return false;
//             }
//         });
//     }
// }