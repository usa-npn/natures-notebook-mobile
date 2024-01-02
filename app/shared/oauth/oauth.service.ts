import config from '../../configuration.js';
import {Injectable} from "@angular/core";
// import {HttpResponse} from "http";
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { ConfigService } from "../config-service";
// var http = require('http');
const http = require("@nativescript/core/http");
var oauthSignature = require("oauth-signature");
var applicationSettings = require("@nativescript/core/application-settings");
import { getJSON } from "@nativescript/core/http";

@Injectable()
export class OauthService {

    constructor(
        public _configService: ConfigService) {
    }

    // initial, login, register
    public loginType: string = "login";

    public registeredAccountsCount = 0;

    // copied consumer from android app
    public consumerKey:string = config.consumerkey;
    private consumerSecret:string = config.consumersecret;
    public token:string[] = ["", "", "", "", "", "", "" , "", "", ""];
    public tokenSecret:string[] = ["", "", "", "", "", "", "" , "", "", ""];
    public oauthCallbackScheme:string = "natures-notebook-oauth";

    // public baseUrl = `http://${this._configService.getHost()}/`;
    public baseUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}/`;
    public requestUrl:string = this.baseUrl + "oauth/request_token";
    public accessUrl:string = this.baseUrl + "oauth/access_token";
    public authorizeUrl:string = this.baseUrl + "oauth/authorize";

    public oauthCompleted = applicationSettings.getBoolean("oauthCompleted");
    
    writeOauthData(accountNumber) {
        console.log("writing oauth data!!!");
        applicationSettings.setString(`token${accountNumber}`, this.token[accountNumber]);
        applicationSettings.setString(`tokenSecret${accountNumber}`, this.tokenSecret[accountNumber]);
        applicationSettings.setBoolean(`oauthCompleted`, true);
        applicationSettings.setBoolean(`showDateTimeTip`, true);
        this.registeredAccountsCount += 1;
        applicationSettings.setString(`registeredAccountsCount`, this.registeredAccountsCount.toString());
    }

    objectToParamString(obj) {
        return '?' + Object.keys(obj).reduce(function (a, k) {
                a.push(k + '=' + obj[k]);
                return a
            }, []).join('&')
    }

    private NONCE_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B',
        'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9'];

    getNonce(nonceSize) {
        var result = [];
        var chars = this.NONCE_CHARS;
        var char_pos;
        var nonce_chars_length = chars.length;

        for (var i = 0; i < nonceSize; i++) {
            char_pos = Math.floor(Math.random() * nonce_chars_length);
            result[i] = chars[char_pos];
        }
        return result.join('');
    }

    getTimestamp() {
        return new Promise((resolve, reject) => {
            getJSON(`${this._configService.getWebServiceProtocol()}://${this._configService.getWebServiceHost()}/${this._configService.getWebServiceSubURL()}/v0/mobile/timestamp`).then((res) => {
                console.log('got timestamp from server!');
                resolve(res['timestamp']);
            }, (e) => {
                console.log("could not get server timestamp.")
                console.log(e);
                resolve(Math.floor((new Date()).getTime() / 1000));
            });
        });   
    }

    async getRequestToken() {
        console.log('GETTING REQUEST TOKEN');
        let httpMethod = 'GET';
        let url = this.requestUrl;
        let timestamp = await this.getTimestamp();
        let parameters:any = {
            oauth_consumer_key: this.consumerKey,
            oauth_nonce: this.getNonce(32),
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0'
        };
        // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
        let encodedSignature = oauthSignature.generate(httpMethod, url, parameters, this.consumerSecret);
        parameters.oauth_signature = encodedSignature;
        let requestWithParams = url + this.objectToParamString(parameters);
        console.log("request: " + requestWithParams);
        // return "blahh";
        return http.request({
            url: requestWithParams, //"https://www.google.com",
            method: "GET"
            //headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
    }

    async getAccessToken(accountNumber): Promise<any> { //Promise<HttpResponse>
        console.log('GETTING ACCESS TOKEN');
        console.log("accountNumber: " + accountNumber);
        console.log("registered accounts count: " + this.registeredAccountsCount);
        console.log("token: " + this.token);
        console.log("tokenSecret: " + this.tokenSecret);
        console.log("consumerKey: " + this.consumerKey);
        console.log("consumerSecret: " + this.consumerSecret);
        let httpMethod = 'GET';
        let url = this.accessUrl;
        let timestamp = await this.getTimestamp();
        let parameters:any = {
            oauth_consumer_key: this.consumerKey,
            oauth_nonce: this.getNonce(32),
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            oauth_token: this.token[accountNumber]
        };
        // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
        let encodedSignature = oauthSignature.generate(httpMethod, url, parameters, this.consumerSecret, this.tokenSecret[accountNumber]);
        parameters.oauth_signature = encodedSignature;
        let requestWithParams = url + this.objectToParamString(parameters);
        console.log("request: " + requestWithParams);
        return http.request({
            url: requestWithParams,
            method: "GET"
        })
    }

    // getRequestOptions(userToken) {
    //     let headers = new Headers();
    //     if(this._configService.debug) { //override with manually specified usertoken
    //         headers.append('token', this._configService.userToken);
    //     } else {
    //         headers.append('token', userToken);
    //     }
    //     headers.append('consumer_key', this.consumerKey);
    //     return new RequestOptions({ headers: headers });
    // }

    getRequestOptions(userToken) {
        const httpOptions = {
            headers: new HttpHeaders({
              'consumer_key':  this.consumerKey
            })
          };
        if(this._configService.debug) { //override with manually specified usertoken
            httpOptions.headers = httpOptions.headers.set('token', this._configService.userToken);
        } else {
            httpOptions.headers = httpOptions.headers.set('token', userToken);
        }
        return httpOptions;
    }

    //oauth2
    
    authorize(authCode) {
        console.log('OAUTH2 Retreiving auth token');
        console.log(authCode);
        let oauth2ConsumerKey:string = config.oauth2Consumerkey;
        let authorizeUrl:string = `https://prod.usanpn.org/oauth/token`;
        let body = new HttpParams()
            .set('grant_type', "authorization_code")
            .set('client_id', oauth2ConsumerKey)
            .set('redirect_uri', `https://prod.usanpn.org/oauth-finished`)
            .set('code', authCode);
        return http.request({
            url: authorizeUrl,
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            content: body.toString(),
        })
    }

    getUserId(access_token) {
        console.log('OAUTH2 Retreiving userId');
        applicationSettings.setBoolean(`oauth2registered`, true);
        let oauth2ConsumerKey:string = config.oauth2Consumerkey;
        let userIdUrl:string = `https://${this._configService.getHost()}/oauth/userinfo`;
        return http.request({
            url: userIdUrl,
            method: "GET",
            headers: { "Content-Type": "application/x-www-form-urlencoded",
                       "Authorization": "Bearer " + access_token }
        })
    }
}
