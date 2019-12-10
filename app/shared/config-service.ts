import {Injectable} from "@angular/core";
import config from '../configuration.js';

@Injectable()
export class ConfigService {
    constructor() {}

    public releaseType = config.releaseType;
    public version = config.version;
    
    //these are for when you want to load a sqlite db in from a debug upload
    //to do this, name the database debug.db and drop it in the app folder
    //normally the userToken is saved in the local store, but when debug is true, then
    //the userToken variable below is instead used. You can manually grab this from the drupal database
    public debug = config.debug;
    public userToken = null;

    public disableSyncing = config.disableSyncing;
    

    public getProtocol() {
        return 'https';
    }

    public getWebServiceProtocol() {
        return 'https';
    }

    public getHost() {
        if(this.releaseType === 'development') {
            return 'www-dev.usanpn.org';
        } else {
            return 'www.usanpn.org';
        }
    }

    public getWebServiceHost() {
        if(this.releaseType === 'development') {
            return 'data-dev.usanpn.org';
        } else {
            return 'data.usanpn.org';
        }
    }

}