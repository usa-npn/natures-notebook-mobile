import { NativeScriptCommonModule } from "@nativescript/angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { SettingsComponent } from "./settings.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { SettingsRoutingModule } from "./settings.routing"; // import the routing module

import { PrivacyModal } from "./privacy-modal/privacy-modal.component";


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        SettingsRoutingModule
    ],
    declarations: [
        SettingsComponent,
        PrivacyModal
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
        PrivacyModal
    ]
})
export class SettingsModule { }