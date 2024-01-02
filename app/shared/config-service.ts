import {Injectable} from "@angular/core";
import config from '../configuration.js';
var applicationSettings = require("@nativescript/core/application-settings");
import { getJSON } from "@nativescript/core/http";


@Injectable()
export class ConfigService {
    constructor() {}

    public releaseType = config.releasetype;
    public version = config.version;
    
    //these are for when you want to load a sqlite db in from a debug upload
    //to do this, name the database debug.db and drop it in the app folder
    //normally the userToken is saved in the local store, but when debug is true, then
    //the userToken variable below is instead used. You can manually grab this from the drupal database
    public debug = config.debug;
    public userToken = null;

    public disableSyncing = config.disableSyncing;

    alreadyGotMigrationStatus = false;
    cloudMigrationStatus = true;
    first = true;

    public host = 'prod.usanpn.org';
    public webServiceHost = 'services.usanpn.org';
    public webServiceSubUrl = 'web-services';




    private sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    // public askServerIfCloudMigrationFinished() {
    //     return new Promise ((resolve, reject) => {
    //         getJSON(`https://services.usanpn.org/web-services/v0/mobile/cloudMigrationStatus`).then((res) => {
    //                 console.log("server response: " + JSON.stringify(res));
    //                 console.log('migrationComplete: ' + res['migrationComplete']);
    //                 this.alreadyGotMigrationStatus = true;
    //                 if(res['migrationComplete'] == 1) {
    //                     this.cloudMigrationStatus = true;
    //                     this.host = 'prod.usanpn.org';
    //                     this.webServiceHost = 'services.usanpn.org';
    //                     this.webServiceSubUrl = 'web-services';
    //                     resolve(true);
    //                 }
    //                 else {
    //                     this.cloudMigrationStatus = false;
    //                     this.host = 'www.usanpn.org';
    //                     this.webServiceHost = 'data.usanpn.org';
    //                     this.webServiceSubUrl = 'webservices';
    //                     resolve(false);
    //                 }
    //         }, (e) => {
    //             console.log('could not connect to server endpoint /v0/mobile/cloudMigrationStatus');
    //             // alert("Can't connect to the Nature's Notebook server. Please wait and try again later.");
    //             resolve(false);
    //         });
    //     });
    // }
    
    // public async cloudMigrationFinished() {
    //     //if the app already registered with oath2, then continue to register that way (don't need to recheck server)
    //     if(applicationSettings.getBoolean(`oauth2registered`) == true)
    //         return true;
    //     else if(this.alreadyGotMigrationStatus)
    //         return this.cloudMigrationStatus;
    //     else {
    //         if(!this.first) {
    //             this.sleep(300).then(async () => { 
    //                 return this.cloudMigrationFinished();
    //              });
    //         } else {
    //             this.first = false;
    //             return await this.askServerIfCloudMigrationFinished();
    //         }
    //         // return true;
    //     }
            
    // }

    public cloudMigrationFinished() {
        return true;
    }

    public getProtocol() {
        return 'https';
    }

    public getWebServiceProtocol() {
        return 'https';
    }

    public getHost() {
        return this.host;
    }

    public getWebServiceHost() {
        return this.webServiceHost;
    }

    public getWebServiceSubURL() {
        return this.webServiceSubUrl;
    }

    public getOauth2Consumerkey() {
        return config.oauth2Consumerkey
    }

}