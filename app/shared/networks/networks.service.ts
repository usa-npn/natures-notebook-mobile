import {Network} from "./network";
import {Person} from "../people/person";
import {Injectable} from "@angular/core";
import {DatabaseService} from "../database/database.service";
import {Observable, throwError} from "rxjs";
import {SyncableTableService} from "../syncable-table-service";
import {NetworkHierarchy} from "./network-hierarchy";
import {NetworkPeopleService} from "./network-people.service";
import { map, catchError } from "rxjs/operators";
import { ConfigService } from "../config-service";
import { HttpClient } from "@angular/common/http";
import { NetworkPerson } from "./network-person";
const applicationSettings = require("@nativescript/core/application-settings");

@Injectable()
export class NetworksService extends SyncableTableService {

    constructor(public http: HttpClient,
                public _databaseService: DatabaseService,
                public _networkPeopleService: NetworkPeopleService,
                public _configService: ConfigService) {
        super(http, _databaseService, _configService);

        this.sqLiteTypes.set('network_id', 'integer primary key');
        this.sqLiteTypes.set('name', 'text');
        this.sqLiteTypes.set('user_display', 'integer');
        this.sqLiteTypes.set('no_group_site', 'integer');
        this.sqLiteTypes.set('drupal_tid', 'integer');
        this.sqLiteTypes.set('deleted', 'integer');
        this.mySites.name = 'Personal Sites';
        this.mySites.network_id = -1;
    }

    serviceName = 'networks';
    tableName = 'networks';
    primaryKey = 'network_id';
    // parentJoinColumn = 'network_id';

    serverTableColumns = [
        'network_id',
        'name',
        'user_display',
        'no_group_site',
        'drupal_tid'
    ];

    tableColumns = this.serverTableColumns.concat(this.additionalTableColumns);

    sqLiteTypes = new Map<string, string>();

    public showJoinGroupModal:Boolean = false;

    public personBelongsToNetwork: Boolean = false;
    public networks: Network[] = [];
    public _selectedNetwork: Network;
    private personIdToNetworksMap = new Map<number, Network[]>();

    //this isn't a real group, but used as a placeholder to hold nongroup sites, has network_id = -1
    public mySites: Network = new Network();

    // setter and getter used here to accommodate retaining the selectedNetwork in the localstore when app is closed
    set selectedNetwork(selectedNetwork: Network) {
        for(let network of this.networks) {
            (network.network_id === selectedNetwork.network_id) ? network.selected = true : network.selected = false;
        }
        this._selectedNetwork = selectedNetwork;
        applicationSettings.setString('selectedNetworkID', selectedNetwork.network_id.toString());
    }

    get selectedNetwork() {
        // first try and grab the network matching the network_id saved in the local store
        let storedNetworkId = null;
        try {
            storedNetworkId = +applicationSettings.getString('selectedNetworkID');
        } catch(err) {
            applicationSettings.getNumber('selectedNetworkID');
        }
        for(let network of this.networks) {
            if (network.network_id === storedNetworkId) {
                this._selectedNetwork = network;
                network.selected = true;
                return network;
            }
        }

        // otherwise if there is only one network other than mysites that's not a group site, select it
        if(this.networks.length === 2 && this.networks[1].no_group_site != 1) {
            this._selectedNetwork = this.networks[1];
            this.networks[1].selected = true;
            return this.networks[1];
        }

        // otherwise attempt to select the first non hidden network if there are any networks
        for (let network of this.networks) {
            if (network.no_group_site != 1) {
                this._selectedNetwork = network;
                network.selected = true;
                return network;
            }
        }
        return null;
    }

    async loadNetworksForPerson(person: Person, networkIdToSelect: number = null) {
        if (this.personIdToNetworksMap.has(person.person_id)) {
            this.networks = [this.mySites].concat(this.personIdToNetworksMap.get(person.person_id).sort((a, b) => {return (a.name < b.name) ? -1 : 1}));
            this.personBelongsToNetwork = true;
        } else {
            this.networks = [this.mySites];
            this.personBelongsToNetwork = false;
        }
        // reset the selected network
        for (var network of this.networks) {
            network.selected = false;
        }
        if (networkIdToSelect) {
            for (var network of this.networks) {
                if (network.network_id === networkIdToSelect) {
                    this.selectedNetwork = network;
                    break;
                }
            }
        }
    }

    async loadPersonToNetworksMap() {
        this.personIdToNetworksMap = new Map<number, Network[]>();

        let [networks, networkPeople] = await Promise.all([
            this.getFromDatabase(),
            this._networkPeopleService.getFromDatabase()
        ]);

        networkPeople.filter((np: NetworkPerson) => np.deleted != 1).forEach((networkPerson: any) => {
            networks.forEach((network : any) => {
                if(network.network_id === networkPerson.network_id) { // && network.no_group_site != 1

                    network.is_admin = networkPerson.is_admin;

                    if(this.personIdToNetworksMap.has(networkPerson.person_id)) {
                        let currentPersonNetworks =  this.personIdToNetworksMap.get(networkPerson.person_id);
                        this.personIdToNetworksMap.set(networkPerson.person_id, currentPersonNetworks.concat(network));
                    } else {
                        this.personIdToNetworksMap.set(networkPerson.person_id, [network]);
                    }
                    // no break in forEach?
                }
            });
        });
    }

    async getHierarchyFromServer(): Promise<NetworkHierarchy[]> {
        const serviceName = `networks/hierarchy`;
        const getUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + serviceName;
        console.log(`retrieving ${getUrl}`);
        return this.http.get<NetworkHierarchy[]>(getUrl)
        .pipe(catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl}`);
            return throwError(err);
        }))
        .toPromise();
    };

    async getLppsFromServer(): Promise<NetworkHierarchy[]> {
        const serviceName = `networks/getLpps`;
        const getUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/` + serviceName;
        console.log(`retrieving ${getUrl}`);
        return this.http.get<NetworkHierarchy[]>(getUrl)
        .pipe(catchError(err => {
            this._databaseService.logSyncError(`ERROR: ${err} POST: ${getUrl}`);
            return throwError(err);
        }))
        .toPromise();
    };

    isAdmin() {
        return this.selectedNetwork && (this.selectedNetwork.network_id === -1 || this.selectedNetwork.is_admin === 1);
    }

}
