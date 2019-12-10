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
    templateUrl: './tooltip.html',
    styleUrls: ["../observe-common.scss"]
})
export class ToolTipModal {
    lightbulbIcon = icons.lightbulbIcon;

    public tipText: string;

    constructor(private params: ModalDialogParams,
                page: Page) {
        page.backgroundColor = new Color(50, 0, 0, 0);
        this.tipText = params.context.tipText;
        // page.borderRadius = 5;
    }

    public closeModal() {
        this.params.closeCallback(false);
    }
}