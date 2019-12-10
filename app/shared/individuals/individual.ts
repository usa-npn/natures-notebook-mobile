import {Species} from "../species/species";
import {Site} from "../sites/site";
import {SpeciesProtocol} from "../species/species_protocol";
import {Observation} from "../observations/Observation";
import {ObservationGroup} from "../observation-groups/observation-group";
export class Individual {
    individual_id: number;
    station_id: number;
    species_id: number;
    individual_userstr: string;
    shade_status: string;
    watering: number;
    is_group: number;
    comment: string;
    active: number;
    seq_num: number;
    last_alive_date: string;
    death_observed_date: string;
    death_reason: string;
    death_comment: string;
    is_wild: number;
    supplemental_feeding: number;
    clone_line_id: number;
    planting_date_day: string;
    planting_date_month: string;
    planting_date_year: string;
    inactivate_comment: string;
    create_date: string;
    shutter_open: string;
    gender: string;
    patch: number;
    patch_size: number;
    patch_size_units_id: number;
    file_url: string;
    selected: boolean;
    species: Species;
    observations: Map<Date, Observation[]>;
    site: Site;
    deleted: number;
    local_id: number;
    timestamp: number;
    sync_status: number;
    sync_message: string;
    observed: boolean;
    notPresent: boolean;

    // server fields
    public insert_object: object;
    public update_object: object;
    public client_id: string;
    public inserted: boolean;
    public updated: boolean;
    public status: string;

    constructor() {
        this.local_id = null;
        this.individual_id = null;
        this.deleted = 0;
        this.timestamp = new Date().getTime();
    }
}