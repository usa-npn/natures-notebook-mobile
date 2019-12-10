// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { NativeScriptAnimationsModule } from "nativescript-angular/animations";
import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {NativeScriptHttpClientModule} from "nativescript-angular/http-client";
import { AppComponent } from './app.component';
import {SitesComponent} from './pages/sites/sites.component';
import {NewSiteComponent} from './pages/sites/new-site/new-site.component';
import {ObserveComponent} from './pages/observe/observe.component';
import {SiteVisitDetailsComponent} from './pages/observe/site-visit-details/site-visit-details.component';
import {PlantsComponent} from './pages/observe/plants/plants.component';
import { routing } from './app.routing'
import { DatabaseService } from './shared/database/database.service';
import { SyncService } from './shared/sync/sync.service';
import { NetworkMonitorService } from './shared/network-monitor/network-monitor.service';
import { OauthService } from './shared/oauth/oauth.service';
import { SitesService } from './shared/sites/sites.service';
import { PeopleService } from './shared/people/people.service';
import { PhenophasesService } from './shared/phenophases/phenophases.service';
import { PhenophaseDefinitionsService } from './shared/phenophases/phenophase-definitions.service';
import { ProtocolPhenophasesService } from './shared/phenophases/protocol-phenophases.service';
import { SpeciesService } from './shared/species/species.service';
import { SettingsService } from './shared/settings/settings.service';
import {registerElement} from "nativescript-angular/element-registry";
import {ModalDialogService, ModalDialogOptions} from "nativescript-angular/modal-dialog";
import {SiteInfoModal} from "./pages/sites/site-info/site-info-modal.component";
import {IndividualsService} from "./shared/individuals/individuals.service";
import {SyncingComponent} from "./pages/syncing/syncing.component";
import {NativeScriptFormsModule} from "nativescript-angular";
import {SiteCreationModal} from "./pages/sites/new-site/site-creation-modal.component";
import {NetworksService} from "./shared/networks/networks.service";
import {SitesPipe} from './pages/sites/sites.pipe';
import {PickerModal} from "./pages/modals/picker-modal/picker-modal.component";
import {DateTimePickerModal} from "./pages/observe/modals/date-time-picker-modal.component";
import {SpeciesSpecificPhenophaseInformationService} from "./shared/species/species-specific-phenophase-information.service";
import {AbundanceCategoriesService} from "./shared/phenophases/abundance-categories.service";
import {AbundanceValuesService} from "./shared/phenophases/abundance-values.service";
import {AbundanceCategoriesAbundanceValuesService} from "./shared/phenophases/abundance-categories-abundance-values.service";
import {SpeciesProtocolsService} from "./shared/species/species-protocols.service";
import {NetworkPeopleService} from "./shared/networks/network-people.service";
import {ObservationsService} from "./shared/observations/observations.service";
import {ObservationGroupsService} from "./shared/observation-groups/observation-groups.service";
import {PlantsPipe} from "./pages/observe/plants/plants.pipe";
import {PhenophaseInfoModal} from "./pages/observe/modals/phenophase-info-modal.component";
import {AnimalsChecklistComponent} from "./pages/observe/animal-checklist/animals-checklist.component";
import {AnimalsPipe} from "./pages/observe/animals.pipe";
import {ObserveService} from "./pages/observe/observe.service";
import {FormsModule} from "@angular/forms";
import {SpeciesTypesService} from "./shared/species/species-types.service";
import {SpeciesSpeciesTypesService} from "./shared/species/species-species-types.service";
require('./helpers');

// import * as applicationModule from "application";
import {PickerSearchPipe} from "./pages/modals/picker-modal/picker-search.pipe";
import {SyncStatusObservationPipe} from "./pages/sync/syncStatusObservation.pipe";
import {ToolTipModal} from "./pages/observe/modals/tooltip";
import { ModelService } from './shared/model/model.service';
import { AnimalPhenophasesModal } from './pages/observe/modals/animals/animals.component';
import { InformationModal } from './pages/modals/information-modal/information-modal.component';
import { ConfigService } from './shared/config-service';
import { AlertModal } from './pages/modals/alert-modal/alert-modal.component';
import { ScistarterService } from './shared/scistarter/scistarter.service';
import { Http, HttpModule } from '@angular/http';

// registerElement("Emoji", () => require("nativescript-emoji").Emoji);
registerElement('ImageZoom', () => require('nativescript-image-zoom').ImageZoom);

@NgModule({
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        AbundanceCategoriesAbundanceValuesService,
        AbundanceCategoriesService,
        AbundanceValuesService,
        DatabaseService,
        IndividualsService,
        ModalDialogService,
        ModelService,
        NetworkMonitorService,
        NetworkPeopleService,
        NetworksService,
        OauthService,
        ObservationGroupsService,
        ObservationsService,
        ObserveService,
        PeopleService,
        PhenophaseDefinitionsService,
        PhenophasesService,
        ProtocolPhenophasesService,
        ScistarterService,
        SettingsService,
        SitesService,
        SpeciesProtocolsService,
        SpeciesService,
        SpeciesSpeciesTypesService,
        SpeciesSpecificPhenophaseInformationService,
        SpeciesTypesService,
        SyncService,
        ConfigService
    ],
    declarations: [
        AnimalsChecklistComponent,
        AnimalPhenophasesModal,
        AnimalsPipe,
        AppComponent,
        DateTimePickerModal,
        InformationModal,
        AlertModal,
        NewSiteComponent,
        ObserveComponent,
        PhenophaseInfoModal,
        PickerModal,
        PickerSearchPipe,
        PlantsComponent,
        PlantsPipe,
        SiteCreationModal,
        SiteInfoModal,
        SitesComponent,
        SitesPipe,
        SiteVisitDetailsComponent,
        SyncingComponent,
        SyncStatusObservationPipe,
        ToolTipModal
    ],
    entryComponents: [
        AnimalPhenophasesModal,
        DateTimePickerModal,
        InformationModal,
        AlertModal,
        PhenophaseInfoModal,
        PickerModal,
        SiteCreationModal,
        SiteInfoModal,
        ToolTipModal
    ],
    bootstrap: [
        AppComponent
    ],
    imports: [
        FormsModule,
        NativeScriptAnimationsModule,
        NativeScriptFormsModule,
        NativeScriptHttpClientModule,
        NativeScriptModule,
        NativeScriptRouterModule,
        routing,
        HttpModule
    ]
})
export class AppModule {}