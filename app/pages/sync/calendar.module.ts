import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { CalendarComponent } from "./calendar.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { CalendarRoutingModule } from "./calendar.routing"; // import the routing module

import { NativeScriptUICalendarModule } from "nativescript-ui-calendar/angular";
import { DayObservationReviewModal } from './modals/day-observations-review';
import { SyncQueueModal } from './modals/sync-queue';
import { LegendModal } from "./modals/legend";



@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        CalendarRoutingModule,
        NativeScriptUICalendarModule
    ],
    declarations: [
        CalendarComponent,
        DayObservationReviewModal,
        SyncQueueModal,
        LegendModal
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
        DayObservationReviewModal,
        SyncQueueModal,
        LegendModal
    ]
})
export class CalendarModule { }