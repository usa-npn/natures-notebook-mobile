import {Injectable} from "@angular/core";
import {DatabaseService} from "./database/database.service";
import {Observable, throwError} from "rxjs";
import { map, catchError } from "rxjs/operators";
import 'rxjs/add/operator/catch';
import { ConfigService } from "./config-service";
import { HttpClient } from "@angular/common/http";

//this service contains database table creation methods, and crud operation methods
@Injectable()
export abstract class GenericTableService {
    constructor(public http: HttpClient,//
                public _databaseService: DatabaseService,
                public _configService: ConfigService) {
    }

    protected databaseName = "system_nn_db";
    protected baseUrl = `${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/webservices/v0/`;
    protected abstract serviceName: string;
    protected abstract tableName: string;
    protected abstract primaryKey: string;
    protected abstract serverTableColumns: string[];
    protected additionalTableColumns: string[] = ['deleted'];
    protected abstract tableColumns: string[];
    protected abstract sqLiteTypes = new Map<string, string>([['deleted', 'integer']]);
    protected tableConstraints: string = '';

    getDatabase() {
        if (this.databaseName === 'system_nn_db')
            return this._databaseService.nn_system_db;
        else
            return this._databaseService.db;
    }

    // crud operations ////////////////////
    async getFromDatabase<T> (): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey}`;
        return (await this.getDatabase().all(query)).map(res => <T[]> res);
    };

    async getFromDatabaseWhere<T> (whereColumn, whereValues): Promise<T[]> {
        console.log(`retrieving ${this.tableName} from database`);
        let query = `SELECT * FROM ${this.tableName} WHERE ${whereColumn} IN (${whereValues}) ORDER BY ${this.primaryKey}`;
        return (await this.getDatabase().all(query)).map(res => <T[]> res);
    };

    async deleteFromDatabase(objectToDelete) {
        let query = `UPDATE ${this.tableName} SET deleted = 1 WHERE ${this.primaryKey} = ?`;
        let params = [objectToDelete[this.primaryKey]];
        return this.getDatabase().execSQL(query, params);
    };

    async insertIntoDatabase(objectToInsert) {
        //by default all newly inserted rows to have deleted set to false
        let mappedObjectsToInsert = this.tableColumns.map((column) => {
            if (column === 'deleted')
                return 0;
            else
                return objectToInsert[column]
        });
        let questionMarks = this.tableColumns.map((el) => '?').join(',');
        let query = `INSERT INTO ${this.tableName} (${this.tableColumns.join(',')}) VALUES (${questionMarks})`;
        return this._databaseService.runQueryWithValues(this.getDatabase(), query, mappedObjectsToInsert)
    };

    async updateInDatabase(objectToUpdate) {
        let query = `UPDATE ${this.tableName} SET ${this.serverTableColumns.map((el) => `${el} = ?`).join(',')} WHERE ${this.primaryKey} = ?`;
        let params = this.serverTableColumns.map((el) => objectToUpdate[el]).concat(objectToUpdate[this.primaryKey]);
        return this.getDatabase().execSQL(query, params);
    };

    async startTransaction() {
        console.log(`starting transaction`);
        return this.getDatabase().execSQL(`BEGIN`);
    }

    async commitTransaction() {
        console.log(`committing transaction`);
        return this.getDatabase().execSQL(`COMMIT`);
    }

    // table creation methods
    createTable() {
        let query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${this.tableColumns.map((col) => {
            return col + ' ' + this.sqLiteTypes.get(col);
        }).join(',')}${this.tableConstraints})`;
        return this._databaseService.runQuery(this._databaseService.db, query, false);
    }

    createIndex(indexName, columnName) {
        let query = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName} (${columnName})`;
        return this._databaseService.runQuery(this._databaseService.db, query, false);
    }

    addColumn(columnName, columnType) {
        let query = `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ${columnType} NULL DEFAULT NULL;`;
        this._databaseService.db.execSQL(query)
            .then(result => {
                return result;
            })
            .catch(err => {
                console.log('this error can be ignored, sqlite doesnt support add column if not exists');
                // console.log('ERROR: ' + err);
            });
    }

    handleErrors(error) {
        // this._databaseService.logSyncError(error);
        console.log(JSON.stringify(error));
        return throwError(error);
    }

}