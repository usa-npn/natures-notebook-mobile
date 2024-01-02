import { NativeScriptCommonModule } from "@nativescript/angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { WelcomeComponent } from "./welcome.component"; // Import all components that will be used in the lazy loaded module
import { WelcomeRoutingModule } from "./welcome.routing"; // import the routing module


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        WelcomeRoutingModule
    ],
    declarations: [
        WelcomeComponent
    ],
    entryComponents: [
    ]
})
export class WelcomeModule { }