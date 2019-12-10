import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { GroupsComponent } from "./groups.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { GroupsRoutingModule } from "./groups.routing"; // import the routing module

import {JoinGroupModal} from "./join-group/join-group-modal.component";
import {GroupsPipe} from "./join-group/groups.pipe";
import { NativeScriptFormsModule } from "nativescript-angular";


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        GroupsRoutingModule,
        NativeScriptFormsModule
    ],
    declarations: [
        GroupsComponent,
        GroupsPipe,
        JoinGroupModal
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
        JoinGroupModal
    ]
})
export class GroupsModule { }