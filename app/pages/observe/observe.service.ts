import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";

@Injectable()
export class ObserveService {

    constructor() {
    }

    public selectedTab: BehaviorSubject<string> = new BehaviorSubject<string>('plants');

}