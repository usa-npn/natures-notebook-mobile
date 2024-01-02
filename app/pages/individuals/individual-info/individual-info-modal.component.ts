import {AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectorRef} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import {PanGestureEventData, PinchGestureEventData, SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {Individual} from "../../../shared/individuals/individual";
// import {ImageSource} from "@nativescript/core/image-source";
import {IndividualsService} from "../../../shared/individuals/individuals.service";
import {WebView, LoadEventData} from "@nativescript/core/ui/web-view";
import { icons } from "../../icons";
const platform = require("@nativescript/core/platform");
import { DatabaseService } from '~/shared/database/database.service';
// var imageSource = require("image-source");
var fs = require("@nativescript/core/file-system");
// var imageModule = require("ui/image");

var UIViewContentModeScaleAspectFit: any;

@Component({
    moduleId: module.id,
    selector: 'individual-modal-content',
    templateUrl: './individual-info-modal.html',
    styleUrls: ["../individuals-common.scss"]
})

export class IndividualInfoModal implements AfterViewInit {

    public onProfilePage = true;
    public individual: Individual;
    public individualName: string;
    public siteName: string;
    public patch: string;
    public gender: string;
    public showProfile = false;
    public pinchZoom = 1;
    chevronLeft = icons.faArrowLeft;
    chevronRight = icons.faArrowRight;
    backArrow = icons.faBackArrow;
    UIViewContentModeScaleAspectFit: any;

    @ViewChild("profile", {static: false}) profile: ElementRef;
    @ViewChild("zoomer", {static: false}) zoomer: ElementRef;


    public BASE_URL = "https://www.usanpn.org/";

    constructor(private params: ModalDialogParams,
                private _individualsService: IndividualsService,
                private _cdr: ChangeDetectorRef,
                private _dbService: DatabaseService) {
        this.individual = params.context.individual;
        this.individualName = params.context.individualName;
        this.siteName = params.context.siteName;
        this.patch = params.context.patch;
        this.gender = params.context.gender;
    }

    getIndividualImage(individual: Individual) {
        return this._individualsService.getIndividualImage(individual);
    }

    public openSpeciesProfile() {
        this._dbService.log('PROFILE', 'INFO', 'opening: ' + this.BASE_URL+'nn/'+this.individual.species.genus+'_'+this.individual.species.species);
        this.showProfile = true;
        this.onProfilePage = true;
       
        if(platform.isAndroid) {
            //this.profile.nativeElement.android.getSettings().setUseWideViewPort(true);
            this.profile.nativeElement.android.setInitialScale(200);
        } 
        // else if(platform.isIOS) {
        //         this.profile.nativeElement.ios.scalesPageToFit = true;
        //     }
    }

    // public startScale = 1;
    // public scaleX = 1;
    // public scaleY = 1;

    private prevPinchZoom = 1;
    onPinch(args: PinchGestureEventData) {

        // if (args.state === 1) {
        //     const newOriginX = args.getFocusX() - this.deltaX;
        //     const newOriginY = args.getFocusY() - this.deltaY;
        //
        //     const oldOriginX = item.originX * item.getMeasuredWidth();
        //     const oldOriginY = item.originY * item.getMeasuredHeight();
        //
        //     this.deltaX += (oldOriginX - newOriginX) * (1 - this.scaleX);
        //     this.deltaY += (oldOriginY - newOriginY) * (1 - this.scaleY);
        //
        //     item.originX = newOriginX / item.getMeasuredWidth();
        //     item.originY = newOriginY / item.getMeasuredHeight();
        //
        //     this.startScale = item.scaleX;
        // }
        //
        // else if (args.scale && args.scale !== 1) {
        //     let newScale = this.startScale * args.scale;
        //     newScale = Math.min(8, newScale);
        //     newScale = Math.max(0.125, newScale);
        //
        //     this.scaleX = newScale;
        //     this.scaleY = newScale;
        // }

        // console.log(args.scale);
        this.pinchZoom += (args.scale - this.prevPinchZoom);
        this.prevPinchZoom = args.scale;
    }

    private prevDeltaX = 0;
    private prevDeltaY = 0;
    public deltaX = 0;
    public deltaY = 0;
    onPan(args: PanGestureEventData) {

        // console.log("PAN[" + "] deltaX: " + Math.round(args.deltaX) + " deltaY: " + Math.round(args.deltaY));

        if (args.state === 1) {
            this.prevDeltaX = 0;
            this.prevDeltaY = 0;
        }
        else if (args.state === 2) {
            this.deltaX += args.deltaX - this.prevDeltaX;
            this.deltaY += args.deltaY - this.prevDeltaY;

            this.prevDeltaX = args.deltaX;
            this.prevDeltaY = args.deltaY;
        }

        // console.log(args.deltaX);
        // console.log(args.deltaY);
        // this.deltaX = args.deltaX;
        // this.deltaY = args.deltaY;
    }

    public imageFullScreen = false;
    toggleImageFullScreen() {
        this.imageFullScreen = !this.imageFullScreen;
    }

    webViewBack() {
        this.profile.nativeElement.goBack();
    }

    webViewForward() {
        this.profile.nativeElement.goForward();
    }

    public close(result: string) {
        this.params.closeCallback(result);
    }

    ngAfterViewInit() {
        if(platform.isIOS) {
            // this.zoomer.nativeElement.subviews[0].contentMode = UIViewContentModeScaleAspectFit;
        }

        this.profile.nativeElement.on(WebView.loadStartedEvent, (args: LoadEventData) => {
            if(args.error) {
                this._dbService.log('PROFILE', 'ERROR', 'loadStartedEvent' + args.error);
            }
            if(args.url.indexOf(`https://mynpn.usanpn.org/npnapps/species/${this.individual.species.genus}/${this.individual.species.species}`) != -1) {
                this.onProfilePage = true;
            } else {
                this.onProfilePage = false;
            }
            this._cdr.detectChanges();
        });
        this.profile.nativeElement.on(WebView.loadFinishedEvent, (args: LoadEventData) => {
            if(args.error) {
                this._dbService.log('PROFILE', 'ERROR', 'loadFinishedEvent' + args.error);
            }
        });
       
    }
}