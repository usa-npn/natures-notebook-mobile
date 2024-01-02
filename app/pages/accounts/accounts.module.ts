import { NativeScriptCommonModule } from "@nativescript/angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { AccountsComponent } from "./accounts.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { AccountsRoutingModule } from "./accounts.routing"; // import the routing module


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        AccountsRoutingModule
    ],
    declarations: [
        AccountsComponent
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
    ]
})
export class AccountsModule { }