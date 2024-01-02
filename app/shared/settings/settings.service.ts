import {Injectable} from "@angular/core";
import { Observable } from 'rxjs';
var applicationSettings = require("@nativescript/core/application-settings");


@Injectable()
export class SettingsService {
    constructor() {}

    private _wifiOnlySync: boolean = (applicationSettings.getBoolean("wifiOnlySync") != null)
        ? applicationSettings.getBoolean("wifiOnlySync") : true;
    private _recordObservationTime: boolean = (applicationSettings.getBoolean("recordObservationTime") != null)
        ? applicationSettings.getBoolean("recordObservationTime") : false;
    private _useSimplifiedProtocols: boolean = (applicationSettings.getBoolean("useSimplifiedProtocols") != null)
        ? applicationSettings.getBoolean("useSimplifiedProtocols") : false;

    get wifiOnlySync():boolean {
        return this._wifiOnlySync;
    }
    set wifiOnlySync(val:boolean) {
        applicationSettings.setBoolean(`wifiOnlySync`, val);
        this._wifiOnlySync = val;
    }

    get recordObservationTime():boolean {
        return this._recordObservationTime;
    }
    set recordObservationTime(val:boolean) {
        applicationSettings.setBoolean(`recordObservationTime`, val);
        this._recordObservationTime = val;
    }

    get useSimplifiedProtocols():boolean {
        return this._useSimplifiedProtocols;
    }
    set useSimplifiedProtocols(val:boolean) {
        applicationSettings.setBoolean(`useSimplifiedProtocols`, val);
        this._useSimplifiedProtocols = val;
    }
}