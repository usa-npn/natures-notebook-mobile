import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { IndividualsComponent } from "./individuals.component"; // Import all components that will be used in the lazy loaded module
//import { FeatureService } from "./feature.service"; // Import all services that will be used in the lazy loaded module
import { IndividualsRoutingModule } from "./individuals.routing"; // import the routing module

import {IndividualInfoModal} from "./individual-info/individual-info-modal.component";
import {SpeciesPipe} from "./new-individual/species.pipe";
import { NewIndividualModal } from "./new-individual/new-individual-modal.component";
import { NativeScriptFormsModule } from "nativescript-angular";


@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        NativeScriptCommonModule,
        IndividualsRoutingModule,
        NativeScriptFormsModule
    ],
    declarations: [
        IndividualsComponent,
        SpeciesPipe,
        IndividualInfoModal,
        NewIndividualModal
        
    ], // declare all components that will be used within the module
    //providers: [ FeatureService ] // provide all services that will be used within the module
    entryComponents: [
        IndividualInfoModal,
        NewIndividualModal
    ]
})
export class IndividualsModule { }