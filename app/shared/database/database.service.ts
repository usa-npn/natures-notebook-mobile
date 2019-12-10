import {Injectable} from "@angular/core";
var Sqlite = require("nativescript-sqlite");
var http = require("http");
import * as fs from "file-system";
var app = require("application");
import * as platform from "platform";
import { ConfigService } from "../config-service";
import { getJSON } from "tns-core-modules/http";

// service provides database query running, system database loading and updating, and database logging
@Injectable()
export class DatabaseService {
    constructor(
        public _configService: ConfigService
    ) {}

    private systemDbName = "nn_system.db";
    
    private _db;
    private _nn_system_db;

    get db() {
        return this._db;
    }

    get nn_system_db() {
        return this._nn_system_db;
    }

    set db(database) {
        this._db = database;
    }

    set nn_system_db(database) {
        this._nn_system_db = database;
    }

    runQuery(database, query, logQuery = true) {
        if(database) {
            return database.execSQL(query)
                .then(result => {
                    if(logQuery)
                        this.logDbInfo(query);
                    return result;
                })
                .catch(err => {
                    console.log('ERROR: ' + err);
                    if(logQuery)
                        this.logDbError(`QUERY: ${query} ERROR: ${err}`);
                });
        }
    }

    runQueryWithValues(database, query, values, logQuery = true) {
        if(database) {
            return database.execSQL(query, values)
            .then(result => {
                if(logQuery)
                    this.logDbInfo(`QUERY: ${query} VALUES: ${values}`);
                return result;
            })
            .catch(err => {
                console.log('ERROR: ' + err);
                if(logQuery)
                    this.logDbError(`QUERY: ${query} VALUES: ${values} ERROR: ${err}`);
            });
        }
    }

    // system database updating and loading //////////////////

    _getContext() {
        if (app.android.context) {
            return (app.android.context);
        }
        var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
        if (ctx) return ctx;

        ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
        return ctx;
    }

    copyDatabaseAndroid(name, currentDBPath) {
        if (name.indexOf('/')) {
            name = name.substring(name.indexOf('/')+1);
        }
        var dbname = this._getContext().getDatabasePath(name).getAbsolutePath();
        var path = dbname.substr(0, dbname.lastIndexOf('/') + 1);
        var backupDBPath = path + name;
        var currentDB = new java.io.File(currentDBPath);
        var backupDB = new java.io.File(backupDBPath);
        var success = false;
        try {
            var source = new java.io.FileInputStream(currentDB).getChannel();
            var destination = new java.io.FileOutputStream(backupDB).getChannel();
            destination.transferFrom(source, 0, source.size());
            source.close();
            destination.close();
            success = true;
        } catch(err) {
            console.info('Copy DB error', err);
        }
        return success;
    }

    async getSystemDbVersion() {
        let result = await this.nn_system_db.all("SELECT * FROM mobile_apps;");
        if(result[0] && result[0].database_version) {
            return result[0].database_version;
        } else {
            return '?';
        }
    }

    loadSystemDatabase() {
        return new Promise ((resolve, reject) => {
            if(fs.File.exists(this.getLocalDatabasePath())) {
                (new Sqlite(this.systemDbName)).then(async (db) => {
                    db.resultType(Sqlite.RESULTSASOBJECT);
                    this.nn_system_db = db;
                    this.nn_system_db.resultType(Sqlite.RESULTSASOBJECT);
                    resolve();
                }, error => {
                    console.log("OPEN NN_SYSTEM_DB ERROR", error);
                    reject();
                });
            } else { 
                console.log("NN_SYSTEM DB DOESNT EXIST AND CANT BE DOWNLOADED");
                reject();
            }
        });
    }

    updateAndLoadSystemDatabase() {
        return new Promise ((resolve, reject) => {
            getJSON(`${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/webservices/v0/mobile/database`).then((res) => {
                    console.log("server response: " + JSON.stringify(res));
                    if(fs.File.exists(this.getLocalDatabasePath())) {
                        // compare version numbers
                        (new Sqlite(this.systemDbName)).then(async (db) => {
                            db.resultType(Sqlite.RESULTSASOBJECT);
                            let result = await db.all("SELECT * FROM mobile_apps;");
                            if(result[0].database_version < res['serverDatabaseVersion']) {
                                console.log("system database version is out of date, grabbing new database");
                                resolve(this.downloadSystemDatabase(res['serverDatabasePath']));
                            } else {
                                console.log("system database already up to date");
                                this.nn_system_db = db;
                                this.nn_system_db.resultType(Sqlite.RESULTSASOBJECT);
                                resolve();
                            }
                        }, error => {
                            console.log("OPEN NN_SYSTEM_DB ERROR", error);
                            reject();
                        });
                    } else { 
                        console.log("download because system db doesn't exist locally");
                        resolve(this.downloadSystemDatabase(res['serverDatabasePath']));
                    }
            }, (e) => {
                this.logSyncError('could not connect to server endpoint /v0/mobile/database');
                alert("Can't connect to the Nature's Notebook server. Please try again later.");
            });
        });
    }

    getLocalDatabasePath() {
        let downloadToFolder;
        if (platform.isAndroid) {
            downloadToFolder = fs.knownFolders.currentApp();
        } else {
            downloadToFolder = fs.knownFolders.documents();
        }
        let filePath = fs.path.join(downloadToFolder.path, this.systemDbName);
        return filePath;
    }

    downloadSystemDatabase(serverDatabasePath) {
        let databaseName = this.systemDbName;
        let filePath = this.getLocalDatabasePath();

        return new Promise ((resolve, reject) => {
            console.log("DB: ", databaseName, ", FilePath:", filePath, "Exists:", fs.File.exists(filePath));
            try {
                console.log('getting db from: ');
                console.log(serverDatabasePath);
                http.getFile(serverDatabasePath, filePath).then((result) => {
                    this.logSyncInfo(`GETFILE: ${serverDatabasePath}`);
                    let headers = result.headers;
                    console.log(JSON.stringify(headers));
                    console.log(JSON.stringify(result));
                    console.log("DB: ", databaseName, ", FilePath:", filePath, "Exists:", fs.File.exists(filePath));
                    if (platform.isAndroid) {
                        this.copyDatabaseAndroid(databaseName, filePath);
                    } else {
                        Sqlite.copyDatabase(databaseName);
                    }
                    (new Sqlite(databaseName)).then(db => {
                        this.nn_system_db = db;
                        this.nn_system_db.resultType(Sqlite.RESULTSASOBJECT);
                        resolve();
                    }, error => {
                        console.log("OPEN NN_SYSTEM_DB ERROR", error);
                        reject();
                    });
                }, (error) => {
                    this.logSyncError(`GETFILE: ${serverDatabasePath} ERROR: ${error}`);
                    console.log("Error RETRIEVING DATABASE", error);
                    (new Sqlite(databaseName)).then(db => {
                        this.nn_system_db = db;
                        this.nn_system_db.resultType(Sqlite.RESULTSASOBJECT);
                        resolve();
                    }, error => {
                        console.log("OPEN NN_SYSTEM_DB ERROR", error);
                        reject();
                    });
                });

            }catch(error) {
                console.log(error);
            }
            
        });
    }

    // logging ////////////////////////

    createLogTable() { let query = `CREATE TABLE IF NOT EXISTS logs (
        log_id integer PRIMARY KEY,
        date text NOT NULL,
        category text NOT NULL,
        level text NOT NULL,
        message text NOT NULL)`;
        return this.runQuery(this.db, query);
    }

    // remove oldest 5000 rows in logs table
    async pruneLogs() {
        console.log('pruning logs');
        let query = `DELETE FROM logs WHERE log_id NOT IN (SELECT log_id FROM logs order by log_id desc limit 5000);`;
        return this.runQuery(this.db, query);
    }

    async log(category, level, message) {
        let query = `INSERT INTO logs (date, category, level, message) VALUES (?, ?, ?, ?);`;
        return this.runQueryWithValues(this.db, query, [new Date().toISOString(), category, level, message], false);
    }

    async logNetworkInfo(message) {
        this.log('NETWORK', 'INFO', message);
    }

    async logSyncInfo(message) {
        this.log('SYNC', 'INFO', message);
    }

    async logSyncError(message) {
        this.log('SYNC', 'ERROR', message);
    }

    async logDbInfo(message) {
        this.log('DATABASE', 'INFO', message);
    }

    async logDbError(message) {
        this.log('DATABASE', 'ERROR', message);
    }

    async logGeoCodeError(message) {
        this.log('GEOCODE', 'ERROR', message);
    }

}
