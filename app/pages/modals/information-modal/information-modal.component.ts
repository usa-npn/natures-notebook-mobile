import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {ModalDialogParams} from "nativescript-angular/modal-dialog";
import { SwipeGestureEventData } from "ui/gestures";
import { Page } from 'ui/page';
const pageCommon = require('ui/page/page-common').Page;
import { Color } from 'color';
import * as utils from 'utils/utils';
import {icons} from "../../icons";
var applicationSettings = require("application-settings");

@Component({
    moduleId: module.id,
    selector: 'modal-content',
    templateUrl: './information-modal.html',
    styleUrls: ["../modals-common.scss"]
})
export class InformationModal {
    lightbulbIcon = icons.lightbulbIcon;

    public headerText = "";
    public informationText = "";

    constructor(private params: ModalDialogParams,
                page: Page) {
        page.backgroundColor = new Color(50, 0, 0, 0);
        this.headerText = params.context.headerText;
        this.informationText = params.context.informationText;
    }

    public closeModal() {
        this.params.closeCallback(false);
    }
}