import { ModelService } from "../../shared/model/model.service";
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
  NgZone,
  ChangeDetectorRef
} from "@angular/core";
import { Http } from "@angular/http";
import { OauthService } from "../../shared/oauth/oauth.service";
import { PeopleService } from "../../shared/people/people.service";
import { Person } from "../../shared/people/person";
import { Router } from "@angular/router";
import { SyncService } from "../../shared/sync/sync.service";
import { WebView, LoadEventData } from "ui/web-view";
import { alert } from "ui/dialogs";
import { NetworksService } from "../../shared/networks/networks.service";
import { SitesService } from "../../shared/sites/sites.service";
import { IndividualsService } from "../../shared/individuals/individuals.service";
import { icons } from "../icons";
var applicationSettings = require("application-settings");
var http = require("http");
import * as platform from "platform";
import { Page } from "tns-core-modules/ui/page/page";
import { ConfigService } from "~/shared/config-service";

@Component({
    moduleId: module.id,
    selector: "login",
    templateUrl: "./login.html"
})
export class LoginComponent implements OnInit, AfterViewInit {

    constructor(private _peopleService: PeopleService,
                private _networksService: NetworksService,
                private _sitesService: SitesService,
                private _individualsService: IndividualsService,
                private _oauthService: OauthService,
                private _syncService: SyncService,
                private _modelService: ModelService,
                public _configService: ConfigService,
                private _router: Router,
                private _zone: NgZone,
                private _cdr: ChangeDetectorRef,
                private page:Page
                ) {
        page.actionBarHidden = true;
    }

    @ViewChild("loginWebView", {static: false}) loginWebView: ElementRef;

    public showCancel = false;
    public showBack = false;
    public cancelText = "Cancel"
    public hideWebview = false;
    public loginUrl: string;
    chevronLeft = icons.faArrowLeft;
    chevronRight = icons.faArrowRight;
    arrowLeft = icons.faBackArrow;

    getRequestToken(accountIndex) {
        this._oauthService.getRequestToken().then((response) => {
            console.log("accountIndex: " + accountIndex);
            console.log("get request token status code: " + response.statusCode);
            let result = response.content;
            console.log(result);
            let jsonResult = JSON.parse('{"' + decodeURI(result).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
            this._oauthService.token[accountIndex] = jsonResult.oauth_token;
            this._oauthService.tokenSecret[accountIndex] = jsonResult.oauth_token_secret;
            if (this._oauthService.loginType === "register") {
                this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}//user/register?oauth_token=` + jsonResult.oauth_token;
            }
            else {
                this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}/oauth/authorize?oauth_token=` + jsonResult.oauth_token;
            }
            //setTimeout(() => { this.hideWebview = false; }, 200);
            console.log(`RECIEVED REQUEST TOKEN, setting url to : ${this.loginUrl}`);
        }, (error) => {
            console.log("Error occurred " + error);
        });
    }

    public receivedAccessToken200Status = false;
    async getAccessToken(accountIndex) {
        console.log("in getAccessToken");
        try {
            let response = await this._oauthService.getAccessToken(accountIndex);
        
            console.log("get access token status code: " + response.statusCode);
            if(response.statusCode == 200) {
                this.receivedAccessToken200Status = true;
                let result = response.content;
                console.log(result);
                let jsonResult = JSON.parse('{"' + decodeURI(result.toString()).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
                this._zone.run(() => this._router.navigate(["/syncing"]));
                let people = await this._peopleService.getPersonFromServer(jsonResult.oauth_token, this._oauthService.consumerKey);
                if(people.length > 0) {
                    // don't register the same person twice
                    for (let person of this._peopleService.people) {
                        if (people[0].person_id === person.person_id) {
                            this._peopleService.newAccountAdded = true;
                            this._peopleService.selectedPerson = people[0];
                            this._zone.run(() => this._router.navigate(["/accounts"]));
                            alert(`${person.username} is already registered on your device.`);
                            return;
                        }
                    }

                    this._oauthService.token[accountIndex] = jsonResult.oauth_token;
                    this._oauthService.tokenSecret[accountIndex] = jsonResult.oauth_token_secret;
                    this._oauthService.writeOauthData(accountIndex);

                    console.log('person_id: ');
                    console.log(people[0]['person_id']);
                    applicationSettings.setString(`userToken${people[0]['person_id']}`, this._oauthService.token[accountIndex]);
                    
                    people[0]['completed_signup'] = 1;
                    await this._peopleService.putPeople([people[0]]);

                    await this._peopleService.insertIntoDatabase(people[0]);
                    this._peopleService.newAccountAdded = true;
                    this._peopleService.selectedPerson = people[0];
                    this._peopleService.people = this._peopleService.people.concat(people[0]);
                    await this._syncService.syncAll(true);
                    this._zone.run(() => this.navigateToNextScreen());
                } else {
                    // return to login page because no person was found matching the credentials
                    this._zone.run(() => this._router.navigate(["/login"]));
                    alert('Error logging in please try again.');
                }
                
            } else if(response.statusCode == 200) {
                console.log('not authorized code recieved... haulting');
            }
        } catch (err) {
            console.log('we caught ERROR!!!!');
            console.log(err);
            console.log('there it is');
        }
    }

    cancelLogin() {
        this._router.navigate(["/accounts"])
    }

    webViewBack() {
        this.loginWebView.nativeElement.goBack();
    }

    webViewForward() {
        this.loginWebView.nativeElement.goForward();
    }

    async navigateToNextScreen() {
        await this._modelService.loadModel(true);
        if(this._networksService.personBelongsToNetwork) {
            if(this._networksService.networks.length === 2) { // person belongs to only one group (including mySites)
                this._router.navigate(["/sites"]);
            } else {
                this._router.navigate(["/groups"]);
            }
        } else if(this._sitesService.sites.length > 0) {
            this._router.navigate(["/sites"])
        } else {
            this._router.navigate(["/welcome"]);
        }
    }

    handleBackNavigation(url) {  
        if(url.indexOf(`${this._configService.getProtocol()}://${this._configService.getHost()}//user/register`) != -1) {
            console.log('CASE: //user/register');
            this.hideWebview = false;
            this.showBack = false;
            this.cancelText = "Cancel Account Creation";
            if (this._oauthService.oauthCompleted) {
                this.showCancel = true;
            }
        }
        else if(url.indexOf(`${this._configService.getProtocol()}://${this._configService.getHost()}/user/login`) != -1) {
            console.log('CASE: /user/login');
            this.hideWebview = false;
            this.showBack = false;
            this.cancelText = "Cancel Account Login"
            if (this._oauthService.oauthCompleted) {
                this.showCancel = true;
            }
        }
        else if(url.indexOf(`${this._configService.getProtocol()}://${this._configService.getHost()}//user/logout`) != -1) {
            console.log('CASE: //user/logout');
            this.hideWebview = true;
            this.showBack = false;
            if (this._oauthService.oauthCompleted) {
                
            }
        } else if(url.indexOf(`${this._configService.getProtocol()}://${this._configService.getHost()}/oauth/authorize`) != -1) {
            console.log(url);
            console.log('CASE: authorizing!');
            this.hideWebview = false;
            this.showBack = false;
            this.showCancel = false;
        } else if(url.indexOf(`${this._configService.getProtocol()}://${this._configService.getHost()}/oauth`) != -1
        || url.indexOf('natures-notebook-oauth') != -1) {
            console.log(url);
            console.log('CASE: oauthing!');
            this.showBack = false;
            this.showCancel = false;
        } else {
            console.log('CASE: other!');
            this.showBack = true;
        }
        this._cdr.detectChanges();
    }

    ngOnInit() {
        // hide the webview, logout and wait half a second before requesting a token and unhiding the webview
        // this is for redmine #1012 to prevent the "grant access" screen from sticking between logins
        console.log('login ngOnInit');
        this.hideWebview = true;
        this.showBack = false;
        this.showCancel = false;
        this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}//user/logout`;
        setTimeout(() => {
            this.receivedAccessToken200Status = false;
            this.getRequestToken(this._oauthService.registeredAccountsCount);
        }, 200);
    }


    ngAfterViewInit() {
        
        // loadStartedEvent is only used here because ios isn't detecting loadFinishedEvent - shrug
        this.loginWebView.nativeElement.on(WebView.loadStartedEvent, (args: LoadEventData) => {
            console.log('loadStartedEvent!');
            console.log(this.receivedAccessToken200Status);
            console.log(this._oauthService.registeredAccountsCount);
            console.log(JSON.stringify(args.url));
            this.handleBackNavigation(args.url);
            console.log(args.error);
            if(args && args.url
                    && JSON.stringify(args.url) 
                    && JSON.stringify(args.url).indexOf("callback?oauth_token=") != -1
                    && !(args.error && args.error.indexOf("ERR_UNKNOWN_URL_SCHEME") != -1)
                    && !this.receivedAccessToken200Status) {
                this.getAccessToken(this._oauthService.registeredAccountsCount);
            }
        });

        if(platform.isAndroid) {
            this.loginWebView.nativeElement.on(WebView.loadFinishedEvent, (args: LoadEventData) => {
                // see redmine #1013 for explanation (hide webview to prevent flashing of "Webpage Not Available"
                if(args.error && args.error.indexOf("ERR_UNKNOWN_URL_SCHEME") != -1) {
                    this.hideWebview = true;
                    this._cdr.detectChanges();
                }
                // console.log("args!");
                // for (var key in args) {
                //     console.log(key + "= " + args[key])
                // }
                // if(args && args.url
                //         && JSON.stringify(args.url) && JSON.stringify(args.url).indexOf("?oauth_token=") != -1
                //         && !(args.error && args.error.indexOf("ERR_UNKNOWN_URL_SCHEME") != -1)
                //         && !this.receivedAccessToken200Status) {
                //     this.getAccessToken(this._oauthService.registeredAccountsCount);
                // }
            });
        }
        
    }
}
