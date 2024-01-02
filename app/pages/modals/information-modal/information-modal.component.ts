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