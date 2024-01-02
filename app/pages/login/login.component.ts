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
import { HttpClient } from "@angular/common/http";
import { OauthService } from "../../shared/oauth/oauth.service";
import { PeopleService } from "../../shared/people/people.service";
import { Person } from "../../shared/people/person";
import { Router } from "@angular/router";
import { SyncService } from "../../shared/sync/sync.service";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";
import { alert } from "@nativescript/core/ui/dialogs";
import { NetworksService } from "../../shared/networks/networks.service";
import { SitesService } from "../../shared/sites/sites.service";
import { IndividualsService } from "../../shared/individuals/individuals.service";
import { icons } from "../icons";
var applicationSettings = require("@nativescript/core/application-settings");
var http = require("http");
const platform = require("@nativescript/core/platform");
import { Page } from "@nativescript/core/ui/page";
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
                console.log('jeff1');
                this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}//user/register?oauth_token=` + jsonResult.oauth_token;
            }
            else {
                console.log('jeff2');
                this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}/oauth/authorize?oauth_token=` + jsonResult.oauth_token;
            }
            //setTimeout(() => { this.hideWebview = false; }, 200);
            console.log(`RECIEVED REQUEST TOKEN, setting url to : ${this.loginUrl}`);
        }, (error) => {
            console.log("Error occurred " + error);
        });
    }

    async registerPerson(personToRegister) {
        this._zone.run(() => this._router.navigate(["/syncing"]));
        // don't register the same person twice
        for (let person of this._peopleService.people) {
            if (personToRegister.person_id === person.person_id) {
                this._peopleService.newAccountAdded = true;
                this._peopleService.selectedPerson = personToRegister;
                this._zone.run(() => this._router.navigate(["/accounts"]));
                alert(`${person.username} is already registered on your device.`);
                return;
            }
        }

        // this._oauthService.token[accountIndex] = jsonResult.oauth_token;
        // this._oauthService.tokenSecret[accountIndex] = jsonResult.oauth_token_secret;
        // this._oauthService.writeOauthData(accountIndex);

        console.log('person_id: ');
        console.log(personToRegister['person_id']);
        //applicationSettings.setString(`userToken${personToRegister['person_id']}`, this._oauthService.token[accountIndex]);
        
        personToRegister['completed_signup'] = 1;
        await this._peopleService.putPeople([personToRegister]);

        await this._peopleService.insertIntoDatabase(personToRegister);
        this._peopleService.newAccountAdded = true;
        this._peopleService.selectedPerson = personToRegister;
        this._peopleService.people = this._peopleService.people.concat(personToRegister);
        await this._syncService.syncAll(true);
        this._zone.run(() => this.navigateToNextScreen());
                
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

    async oauth2Authorize(returnUrl) {
        const authCode = returnUrl.slice(
            returnUrl.indexOf('?code=') + 6,
            returnUrl.lastIndexOf('&state='),
        );
        this._oauthService.authorize(authCode).then((response) => {
            // this.hideWebview = true;
            // this._cdr.detectChanges();
            console.log('response456');
            console.log(response.statusCode);
            console.log(response.content);

            let responseJson = JSON.parse(response.content);
            console.log(responseJson['access_token'])
            this._oauthService.getUserId(responseJson['access_token']).then((response) => {
                console.log('response789');
                console.log(response.statusCode);
                console.log(response.content);
                let resultAsJSON = JSON.parse(response.content);

                this._peopleService.getPersonFromServerByUsername(resultAsJSON.name).then((person) => {
                    console.log('returned usanpnperson: ' + JSON.stringify(person));
                    console.log('access_tokenn:' + responseJson['access_token']);
                    applicationSettings.setString(`userToken${person[0]['person_id']}`, responseJson['access_token']);
                    // applicationSettings.setString(`oauth2registered`, 'true');
                    applicationSettings.setBoolean(`oauth2registered`, true);
                    this.registerPerson(person[0]);
                });
            });
        });
    }
    
    // count = 0;
    onWebViewLoadStarted(args){
        console.log('in onwebviewloaded!!!');
        const webView = args.object;
        if (webView.android) {
            webView.android.getSettings().setDomStorageEnabled(true)
        }
        // setTimeout(() => {
        //     if(this.count == 0) {
        //         this.count ++;
        //         console.log('reloadingggggggg')
        //         let oauth2ConsumerKey = this._configService.getOauth2Consumerkey();
        //         this.loginUrl = 'https://prod.usanpn.org/user/login?destination=/data/maps/forecasts';
        //         //this.loginUrl = `https://${this._configService.getHost()}/oauth/authorize?response_type=code&client_id=${oauth2ConsumerKey}&redirect_uri=https://${this._configService.getHost()}&scope=full_access+offline_access&state=jIGL3pWyZsQF8KJL`;
        //         webView.reload();
        //     }
        // }, 60000);
    }

    private useOauth2 = this._configService.cloudMigrationStatus;//cloudMigrationFinished();
    ngOnInit() {
        // const webvieww = <WebView>this.loginWebView.nativeElement;
        // webvieww.on(WebView.loadFinishedEvent, (args:LoadEventData) => {
        //     console.log('seee thisssss');
        //     console.log(args.error);
        //     console.log(args.eventName);
        //     console.log(args.navigationType);
        //     console.log(args.url);
        // });

        // hide the webview, logout and wait half a second before requesting a token and unhiding the webview
        // this is for redmine #1012 to prevent the "grant access" screen from sticking between logins
        console.log('login ngOnInit');
        this.hideWebview = true;
        this.showBack = false;
        this.showCancel = false;
        
        if(this.useOauth2) {
            this.hideWebview = false;
            setTimeout(() => {
                let oauth2ConsumerKey = this._configService.getOauth2Consumerkey();
                this.loginUrl = decodeURI('https://' + this._configService.getHost() + '/oauth/authorize?response_type=code&client_id=' + oauth2ConsumerKey + '&redirect_uri=https://prod.usanpn.org/oauth-finished&scope=full_access+offline_access&state=jIGL3pWyZsQF8KJL');
            }, 300);
            // this.oauth2Authorize();
        } else {
            this.loginUrl = `${this._configService.getProtocol()}://${this._configService.getHost()}//user/logout`;
            setTimeout(() => {
                this.receivedAccessToken200Status = false;
                this.getRequestToken(this._oauthService.registeredAccountsCount);
            }, 200);
        }
        
    }

    censor(censor) {
        var i = 0;
        
        return function(key, value) {
          if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
            return '[Circular]'; 
          
          if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
            return '[Unknown]';
          
          ++i; // so we know we aren't using the original object anymore
          
          return value;  
        }
      }


    ngAfterViewInit() {
        // const webvieww = <WebView>this.loginWebView.nativeElement;

        if(this.useOauth2) {
            // this.loginWebView.nativeElement.set
            // this.loginWebView.nativeElement.on(WebView.loadStartedEvent, (args: LoadEventData) => {
            //     console.log('loadstartedEvent!!!!!');
            //     console.log(JSON.stringify(args,this.censor(args)));
            //     console.log(JSON.stringify(args.url));
            //     if(args && args.url
            //         && JSON.stringify(args.url) 
            //         && JSON.stringify(args.url).indexOf("?code") != -1) {
            //         this.getOauth2AccessToken(this._oauthService.registeredAccountsCount);
            //     }
            // });
            this.loginWebView.nativeElement.on(WebView.loadFinishedEvent, (args: LoadEventData) => {
                console.log('loadFinishedEvent!!!!!!');
                // console.log(JSON.stringify(args,this.censor(args)));
                console.log(JSON.stringify(args.url));
                // this.handleBackNavigation(args.url);
                if(args && args.url
                    && JSON.stringify(args.url) 
                    && JSON.stringify(args.url).indexOf("?code") != -1) {
                        console.log('we are going to send code');
                        this.oauth2Authorize(args.url);
                }
                // else if(args && args.url
                //     && JSON.stringify(args.url) 
                //     && JSON.stringify(args.url).indexOf("/register_redirect") != -1) {
                //         console.log('redirect to auth after register_redirect');
                //         let oauth2ConsumerKey = this._configService.getOauth2Consumerkey();
                //         this.loginUrl = decodeURI('https://' + this._configService.getHost() + '/oauth/authorize?response_type=code&client_id=' + oauth2ConsumerKey + '&redirect_uri=https://' + this._configService.getHost() + '&scope=full_access+offline_access&state=jIGL3pWyZsQF8KJL');
                // }
            });

            // this.loginWebView.nativeElement.on(WebView.propertyChangeEvent, function (changeArgs) {
            //     console.log('prop change')
            //     console.dir(changeArgs); 
            //     // Do something with the URL here.
            //     // E.g. extract the token and hide the WebView.
            // });
        } else {
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
                    console.log('loadFinishedEvent!!!!!');
                    console.log(JSON.stringify(args,this.censor(args)));
                    console.log(JSON.stringify(args.url));
                    // see redmine #1013 for explanation (hide webview to prevent flashing of "Webpage Not Available"
                    // if(args.error && args.error.indexOf("ERR_UNKNOWN_URL_SCHEME") != -1) {
                    //     this.hideWebview = true;
                    //     this._cdr.detectChanges();
                    // }
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
}
