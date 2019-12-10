export class NetworkHierarchy {
    network_id: number;
    network_name: string;
    secondary_network: NetworkHierarchy[];
    tertiary_network: NetworkHierarchy[];
    quaternary_network: NetworkHierarchy[];

    selected: boolean = false;
    showChildren: boolean = false;
    hidden: boolean = false;
}
