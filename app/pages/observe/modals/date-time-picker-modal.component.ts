// /// <reference path="../../../node_modules/tns-platform-declarations/ios/ios.d.ts" /> Needed for autocompletion and compilation.
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import { SwipeGestureEventData } from "@nativescript/core/ui/gestures";
import { Page } from '@nativescript/core/ui/page';
const pageCommon = require('@nativescript/core/ui/page/page-common').Page;
import { Color } from '@nativescript/core/color';
import * as utils from '@nativescript/core/utils';
import {icons} from "../../icons";
var applicationSettings = require("@nativescript/core/application-settings");

@Component({
    moduleId: module.id,
    selector: 'modal-content',
    templateUrl: './date-time-picker-modal.html',
    styleUrls: ["../observe-common.scss"]
})
export class DateTimePickerModal {
    lightbulbIcon = icons.lightbulbIcon;
    showTip;

    maxDate = new Date();
    minDate = new Date(2010, 0, 1);
    public selectedIndex;
    selectedDate:Date;
    selectedTime:Date;

    activeTab = 'show-date';

    public recordObservationTime: boolean;

    constructor(private params: ModalDialogParams,
                page: Page) {
        this.showTip = applicationSettings.getBoolean(`showDateTimeTip`);
        this.recordObservationTime = params.context.recordObservationTime;
        this.selectedDate = params.context.observationDate;
        this.selectedTime = new Date(this.selectedDate.getTime());

        page.backgroundColor = new Color(50, 0, 0, 0);
        // page.borderRadius = 5;
    }

    public onTimeChanged(timeChange) {
        this.selectedTime = new Date(timeChange.value);
    }

    public changePage(selectedTab) {
        this.activeTab = selectedTab;
    }

    public getHeadingText() {
        if (this.activeTab === 'show-date') {
            return "Set Observation Date"
        }
        else {
            return "Set Observation Time"
        }
    }

    public closeTip() {
        applicationSettings.setBoolean(`showDateTimeTip`, false);
        this.showTip = false;
    }

    cancelModal() {
        this.params.closeCallback(null);
    }

    public closeModal() {
        let savedDate = this.selectedDate;
        if(this.recordObservationTime) {
            savedDate.setHours(this.selectedTime.getHours());
            savedDate.setMinutes(this.selectedTime.getMinutes());
            savedDate.setSeconds(0);
            savedDate.setMilliseconds(0);
        }
        else {
            savedDate.setHours(0);
            savedDate.setMinutes(0);
            savedDate.setSeconds(0);
            savedDate.setMilliseconds(0);
        }
        this.params.closeCallback(savedDate);
    }
}