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