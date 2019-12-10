import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { LoginComponent } from "./login.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { LoginRoutingModule } from "./login.routing"; // import the routing module


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        LoginRoutingModule,
    ],
    declarations: [
        LoginComponent
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
    ]
})
export class LoginModule { }