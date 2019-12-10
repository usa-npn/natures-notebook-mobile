import {Injectable} from "@angular/core";
import * as connectivity from "connectivity";
import { SettingsService } from "../settings/settings.service";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class NetworkMonitorService {
    constructor(private _settingsService: SettingsService,
        private _databaseService: DatabaseService) {}
    
    public connectionType: string;
    public connected: boolean;

    initialize() {
        let connectionType = connectivity.getConnectionType();
        switch (connectionType) {
            case connectivity.connectionType.none:
                this.connected = false;
                this.connectionType = "none";
                console.log("No connection");
                this._databaseService.logNetworkInfo("No connection");
                break;
            case connectivity.connectionType.wifi:
                this.connected = true;
                this.connectionType = "wifi";
                console.log("WiFi connection");
                this._databaseService.logNetworkInfo("WiFi connection");
                break;
            case connectivity.connectionType.mobile:
                this.connected = true;
                this.connectionType = "mobile";
                console.log("Mobile connection");
                this._databaseService.logNetworkInfo("Mobile connection");
                break;
        }
    }

    monitorConnection() {
        // let connected = false;
        connectivity.startMonitoring((newConnectionType: number) => {
            switch (newConnectionType) {
                case connectivity.connectionType.none:
                    this.connected = false;
                    this.connectionType = "none";
                    console.log("Connection type changed to none.");
                    this._databaseService.logNetworkInfo("Connection type changed to none.");
                    // connected = false;
                    break;
                case connectivity.connectionType.wifi:
                    this.connected = true;
                    this.connectionType = "wifi";
                    console.log("Connection type changed to WiFi.");
                    this._databaseService.logNetworkInfo("Connection type changed to WiFi.");
                    // connected = true;
                    break;
                case connectivity.connectionType.mobile:
                    this.connected = true;
                    this.connectionType = "mobile";
                    console.log("Connection type changed to mobile.");
                    this._databaseService.logNetworkInfo("Connection type changed to mobile.");
                    // connected = true;
                    break;
            }
        });
        // connectivity.stopMonitoring();
        // return connected;
    }

    canSync(force = false) {
        if (!this.connected) {
            return false;
        }
        if (!force && this._settingsService.wifiOnlySync && this.connectionType != 'wifi') {
            return false;
        }
        return true;
    }
}
