export class ObservationGroup {
    travel_time: number;
    travel_time_units_id: number;
    time_spent: number;
    time_spent_units_id: number;
    duration_of_search: number;
    duration_of_search_units_id: number;
    snow_ground: number;
    snow_ground_coverage: number;
    snow_overstory_canopy: number;
    method: string;
    user_time: number;
    observation_group_date: string;

    local_id: number;
    observation_group_id: number;
    station_id: number;
    observer_id: number;
    selected: boolean;
    deleted: number;
    timestamp: number;
    sync_status: number;
    sync_message: string;

    insert_object: object;
    update_object: object;
    client_id: string;
    inserted: boolean;
    updated: boolean;
    status: string;

    notes: string;

    constructor(
        recordObservationTime: boolean
    ) {
        recordObservationTime ? this.user_time = 1 : this.user_time= 0;
        this.local_id = null;
        this.observation_group_id = null;
        this.selected = false;
        this.deleted = 0;
        this.timestamp = new Date().getTime();
    }
}