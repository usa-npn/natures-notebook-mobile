import {ObservationGroup} from "../observation-groups/observation-group";
import {Site} from "../sites/site";
import {Individual} from "../individuals/individual";
export class Observation {
    local_id: number;
    observation_id: number;
    submission_id: number;
    // observationGroup: ObservationGroup;
    selected: boolean;
    deleted: number;
    timestamp: number;
    sync_status: number;
    sync_message: string;
    site: Site;
    individual: Individual;

    // server fields
    public insert_object: object;
    public update_object: object;
    public client_id: string;
    public inserted: boolean;
    public updated: boolean;
    public status: string;

    constructor(
        public observer_id: number,
        public phenophase_id: number,
        public observation_extent: number,
        public comment: string,
        public individual_id: number,
        public individual_local_id: number,
        public observation_group_id: number,
        public observation_group_local_id: number,
        public protocol_id: number,
        public raw_abundance_value: number,
        public abundance_category: number,
        public abundance_category_value: number,
        public observation_date: string
    ) {
        this.local_id = null;
        this.observation_id = null;
        this.submission_id = null;
        this.deleted = 0;
        this.timestamp = new Date().getTime();
    }
}