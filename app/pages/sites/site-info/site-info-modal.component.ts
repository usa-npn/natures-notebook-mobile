import {Component, ElementRef, ViewChild} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import {PanGestureEventData, PinchGestureEventData, SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {icons} from "../../icons";
var mapsModule = require("nativescript-google-maps-sdk");

@Component({
    moduleId: module.id,
    selector: 'modal-content',
    templateUrl: './site-info-modal.html',
    styleUrls: ["../sites-common.scss"]
})
export class SiteInfoModal {
    public siteName: string;
    public siteLongitude: string;
    public siteLatitude: string;
    public siteImage: string;

    backwardIcon = icons.faArrowLeft;

    padding = [40, 40, 40, 40];
    public zoomLvl = 12;
    bearing = 0;
    tilt = 0;

    constructor(private params: ModalDialogParams) {
        this.siteName = params.context.siteName;
        this.siteLongitude = params.context.siteLongitude;
        this.siteLatitude = params.context.siteLatitude;
        this.siteImage = params.context.siteImage;
    }

    @ViewChild("SiteInfoMapView", {static: false}) mapView: ElementRef;
    public marker = new mapsModule.Marker();

    addMarker() {

        (this.mapView.nativeElement).settings.zoomControlsEnabled = true;

        (this.mapView.nativeElement).latitude = this.siteLatitude;
        (this.mapView.nativeElement).longitude = this.siteLongitude;
        (this.mapView.nativeElement).zoom = this.zoomLvl;

        this.marker.position = mapsModule.Position.positionFromLatLng(this.siteLatitude, this.siteLongitude);
        this.marker.title = `${this.siteName}`;
        this.marker.snippet = `(${this.getLatitude()}, ${this.getLongitude()})`;
        // this.marker.content = `<image border="0" align="Left" src="${this.siteImage}">`;
        this.marker.userData = { index : 1};
        if(this.mapView && this.mapView.nativeElement)
            (this.mapView.nativeElement).addMarker(this.marker);

        this.marker.showInfoWindow();
    }

    public getLatitude() {
        return parseFloat(this.siteLatitude).toFixed(3);
    }

    public getLongitude() {
        return parseFloat(this.siteLongitude).toFixed(3);
    }

    onMapReady = (args) => {
        this.addMarker();
    };

    public showImage(): boolean {
        if (this.siteImage && this.siteImage != "") {
            return true;
        } else {
            return false;
        }
    }

    public imageFullScreen = false;
    toggleImageFullScreen() {
        this.imageFullScreen = !this.imageFullScreen;
    }

    public pinchZoom = 1;
    private prevPinchZoom = 1;
    onPinch(args: PinchGestureEventData) {
        this.pinchZoom += (args.scale - this.prevPinchZoom);
        this.prevPinchZoom = args.scale;
    }

    private prevDeltaX = 0;
    private prevDeltaY = 0;
    public deltaX = 0;
    public deltaY = 0;
    onPan(args: PanGestureEventData) {

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
    }

    public closeSiteInfo(result: string) {
        this.params.closeCallback(result);
    }
}