import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { DebugComponent } from "./debug.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { DebugRoutingModule } from "./debug.routing"; // import the routing module

import { NativeScriptFormsModule } from "nativescript-angular";


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        DebugRoutingModule,
        NativeScriptFormsModule
    ],
    declarations: [
        DebugComponent
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
    ]
})
export class DebugModule { }