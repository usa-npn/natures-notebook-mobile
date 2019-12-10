import {Phenophase} from "../phenophases/phenophase";
import {ProtocolPhenophase} from "../phenophases/protocol-phenophase";

export class SpeciesProtocol {
    species_id: number;
    protocol_id: number;
    active: number;
    start_date: string;
    end_date: string;
    dataset_id: string;
    deleted: boolean;
    protocolPhenophases: ProtocolPhenophase[];
}