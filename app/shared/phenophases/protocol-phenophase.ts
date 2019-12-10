import {Phenophase} from "./phenophase";

export class ProtocolPhenophase {
    protocol_id: number;
    phenophase_id: number;
    seq_num: number;
    active: number;
    deleted: boolean;
    phenophase: Phenophase;
}