import {IndividualsAbstractComponent} from "../../individuals-abstract.component";
import {Component, ViewContainerRef} from "@angular/core";
import {Subscription} from "rxjs";
import {Individual} from "../../../../shared/individuals/individual";
import {ModalDialogOptions} from "@nativescript/angular";
import {ModalDialogParams, ModalDialogService} from "@nativescript/angular";
import { Router } from "@angular/router";
import { IndividualsService } from "../../../../shared/individuals/individuals.service";
import { ObservationGroupsService } from "../../../../shared/observation-groups/observation-groups.service";
import { ObservationsService } from "../../../../shared/observations/observations.service";
import { PeopleService } from "../../../../shared/people/people.service";
import { SitesService } from "../../../../shared/sites/sites.service";
import { SpeciesSpecificPhenophaseInformationService } from "../../../../shared/species/species-specific-phenophase-information.service";
import { ObserveService } from "../../observe.service";
import { Page } from "@nativescript/core/ui/page";
import { SyncService } from "../../../../shared/sync/sync.service";
import { PhenophasesService } from "../../../../shared/phenophases/phenophases.service";
@Component({
    moduleId: module.id,
    selector: "animal-phenophases-modal",
    templateUrl: "./animals.html",
    styleUrls: [
        "../../observe-common.scss",
        "./animals-common.scss"
    ]
})
export class AnimalPhenophasesModal extends IndividualsAbstractComponent {

    constructor(protected modalService: ModalDialogService,
        protected viewContainerRef: ViewContainerRef,
        protected _router: Router,
        protected _individualsService: IndividualsService,
        protected _observationGroupsService: ObservationGroupsService,
        protected _observationService: ObservationsService,
        protected _peopleService: PeopleService,
        protected _sitesService: SitesService,
        protected _sspiService: SpeciesSpecificPhenophaseInformationService,
        protected _syncService: SyncService,
        protected _phenophaseService: PhenophasesService,
        protected _observeService: ObserveService,
        protected page: Page,
        protected params: ModalDialogParams) {
        super(modalService,
            viewContainerRef,
            _router,
            _individualsService,
            _observationGroupsService,
            _observationService,
            _peopleService,
            _sitesService,
            _sspiService,
            _syncService,
            _observeService,
            _phenophaseService,
            page);
        
            this.phenophases = params.context.phenophases;
            this.selectedIndividual = params.context.selectedIndiviual;
    }

    getBackButtonText() {
        return !this.dataTouched ? 'Back' : 'Save Data';
    }

    async backToChecklist() {
        await super.saveObservations();
        this.params.closeCallback(this.phenophases);
    }

    showList = false;
    async ngOnInit() {
        this.dataTouched = false;
        setTimeout(() => {this.showList = true;}, 5);
        this.selectedIndividual = this._individualsService.selectedIndividual;

        this.dateSubscriber = this._observationGroupsService.selectedDate.subscribe(async (date: Date) => {
            this.observationDate = date;
            this.observations = await this._observationService.getObservationsForIndividualAtTime(this.selectedIndividual, this.observationDate);
            this.markPhenophasesFromObservations(this.selectedIndividual, this.phenophases, this.observations);
        });
    }

    async ngOnDestroy() {
        this.dateSubscriber.unsubscribe();
    }
}