import {AndroidActivityBackPressedEventData, AndroidApplication} from "@nativescript/core/application";
import {Page} from '@nativescript/core/ui/page';
import * as application from "@nativescript/core/application";
const platform = require("@nativescript/core/platform");
import { ModelService } from "~/shared/model/model.service";


export class AbstractModal {

    modelService: ModelService;

    constructor(page: Page, modelService: ModelService) {
        this.modelService = modelService;
        // this.modelService.modalStatus.next('open');
        // this.modelService.androidBackButtonPressed.subscribe(status => {
        //     this.cancel();
        // });
        
        // if (platform.isAndroid) {
        //     application.android.removeEventListener(AndroidApplication.activityBackPressedEvent);
        //     application.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
        //         console.log('intercepting android back button');
        //         data.cancel = true; // prevents default back button behavior
        //         this.cancel();
        //     });
        // }
    }

    public cancel() {
        // this.modelService.modalStatus.next('closed');
    }
}