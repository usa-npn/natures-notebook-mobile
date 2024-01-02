import {
    Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectionStrategy,
    ViewContainerRef, OnDestroy, Injectable
} from "@angular/core";
var http = require("http");
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService} from "@nativescript/angular";
import {ModalDialogParams} from "@nativescript/angular";
import {Individual} from "../../shared/individuals/individual";
import {PickerModal} from "../modals/picker-modal/picker-modal.component";
import {IndividualsService} from "../../shared/individuals/individuals.service";
import {Phenophase} from "../../shared/phenophases/phenophase";
import {ObservationGroupsService} from "../../shared/observation-groups/observation-groups.service";
import {Subscription} from "rxjs";
import {PhenophaseInfoModal} from "./modals/phenophase-info-modal.component";
import {AbundanceValue} from "../../shared/phenophases/abundance-value";
import {SwipeGestureEventData} from "@nativescript/core/ui/gestures";
import {Observation} from "../../shared/observations/Observation";
import {ObservationsService} from "../../shared/observations/observations.service";
import {PeopleService} from "../../shared/people/people.service";
import {SpeciesSpecificPhenophaseInformation} from "../../shared/species/species-specific-phenophase-information";
import {AbundanceCategory} from "../../shared/phenophases/abundance-category";
import {ObservationGroup} from "../../shared/observation-groups/observation-group";
import {SpeciesSpecificPhenophaseInformationService} from "../../shared/species/species-specific-phenophase-information.service";
import {ObserveService} from "./observe.service";
import {icons} from "../icons";
import {SitesService} from "../../shared/sites/sites.service";
import {Page} from "@nativescript/core/ui/page";
import { SyncService } from "../../shared/sync/sync.service";
import { PhenophasesService } from "../../shared/phenophases/phenophases.service";
import { PhenophaseDefinition } from "~/shared/phenophases/phenophase-definition";

// @Component({
//     selector: "individuals",
//     template: `
//         <StackLayout>Nothing to see here</StackLayout>
//     `,
//     styleUrls: []
// })
@Injectable()
export abstract class IndividualsAbstractComponent implements OnInit, OnDestroy {

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
                protected _observeService: ObserveService,
                protected _phenophaseService: PhenophasesService,
                protected page: Page
                ) {
        page.actionBarHidden = true;
    }

    activeTab = "site-visit-details";
    calendarIcon = icons.calendarIcon;
    clockIcon = icons.clockIcon;
    infoIcon = icons.infoIcon;
    dropdownIcon = icons.dropdownIcon;
    radioCheckedIcon = icons.radioCheckedIcon;
    radioUncheckedIcon = icons.radioUncheckedIcon;
    notificationIcon = icons.notificationIcon;
    plusIcon = icons.plusIcon;
    minusIcon = icons.minusIcon;
    checkmarkIcon = icons.checkmarkIcon;

    public individuals: Individual[] = [];
    public observationDate: Date;
    public comments: string;
    public phenophases: Phenophase[] = [];
    public phenophasesWithMarkAllNo: Phenophase[] = [];
    public selectedIndividual:Individual;
    public observations: Observation[] = [];
    protected dateSubscriber: Subscription;
    dataTouched = false;
    dataSaved: boolean = false;
    tappedSaveButton: boolean = false;

    async popupIndividualPicker() {

        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                items: this.individuals,
                selectedItem: this.selectedIndividual,
                title: "Choose a plant.",
                pickerType: "individual"
            },
            fullscreen: true
        };

        this.modalService.showModal(PickerModal, options).then(async (selectedPlant: Individual) => {
            if (selectedPlant && this.selectedIndividual.individual_id != selectedPlant.individual_id) {
                await this.saveObservations();
                await this._individualsService.loadIndividualsPhenophaseInformation([selectedPlant]);
                this.setPhenophaseDataFromObservations(selectedPlant);
                this.selectedIndividual = selectedPlant;
                await this._syncService.syncObservations();
                this.dataSaved = false;
            }
        })
    }

    popupPhenophaseInfo(phenophase: Phenophase, forAnimal: boolean) {
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                selectedPlant: this.selectedIndividual,
                selectedPhenophase: phenophase,
                selectedDate: this.observationDate,
                forAnimal: forAnimal
            },
            fullscreen: true
        };

        this.modalService.showModal(PhenophaseInfoModal, options).then(() => {})
    }

    public popupAbundancePicker(phenophase: Phenophase) {

        let notSure: AbundanceValue = new AbundanceValue();
        notSure.short_name = 'Not Sure';

        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                items: [notSure].concat(phenophase.abundanceValues),
                selectedItem: phenophase.abundanceValue || notSure,
                title: phenophase.phenophaseDefinition.phenophase_name,
                subtitle: phenophase.abundanceCategories.map(abundanceCategory => abundanceCategory.description).join(),
                pickerType: "abundance"
            },
            fullscreen: true
        };

        this.modalService.showModal(PickerModal, options).then((selectedAbundanceValue : AbundanceValue) => {
            if (selectedAbundanceValue) {
                if (selectedAbundanceValue.short_name === 'Note Sure') {
                    selectedAbundanceValue = null;
                }
                if (phenophase.abundanceValue != selectedAbundanceValue) {
                    phenophase.abundanceValue = selectedAbundanceValue;
                    this.dataSaved = false;
                }
            }
        })
    }

    incrementIntensity(phenophase: Phenophase) {
        this.dataTouched = true;
        this.dataSaved = false;
        if (phenophase.intensity == null) {
            phenophase.intensity = 1;
        } else if (phenophase.intensity < 1000000) {
            phenophase.intensity++;
        } else {
            phenophase.intensity = 1;
        }
    }

    decrementIntensity(phenophase: Phenophase) {
        this.dataTouched = true;
        this.dataSaved = false;
        if (phenophase.intensity == null || phenophase.intensity < 1 || phenophase.intensity == 1) {
            phenophase.intensity = null;
        } else if (phenophase.intensity > 0 && phenophase.intensity <= 1000000) {
            phenophase.intensity--;
        }
        else {
            phenophase.intensity = null;
        }
    }

    changePhenophaseSelection(phenophase: Phenophase, selector: string) {
        this.dataTouched = true;
        this.dataSaved = false;
        switch(selector) {
            case "yes": {
                phenophase.yesSelected = !phenophase.yesSelected;
                if(phenophase.yesSelected) {
                    phenophase.intensity = null;
                    phenophase.abundanceValue = null;
                    phenophase.noSelected = false;
                    phenophase.notSureSelected = false;
                }
                if (phenophase.yesSelected && phenophase.abundanceCategories && phenophase.abundanceCategories.length > 0) {
                    this.popupAbundancePicker(phenophase)
                }
                break;
            }
            case "no": {
                phenophase.noSelected = !phenophase.noSelected;
                if(phenophase.noSelected) {
                    phenophase.yesSelected = false;
                    phenophase.notSureSelected = false;
                    phenophase.intensity = null;
                    phenophase.abundanceValue = null;
                } 
                break;
            }
            default: {
                phenophase.notSureSelected = !phenophase.notSureSelected;
                if (phenophase.notSureSelected) {
                    phenophase.intensity = null;
                    phenophase.abundanceValue = null;
                    phenophase.noSelected = false;
                    phenophase.yesSelected = false;
                } 
                break;
            }
        }
    }

    private getAbundanceCategories(speciesSpecificInformation: SpeciesSpecificPhenophaseInformation[]): AbundanceCategory[] {
        let abundanceCategories = [];
        speciesSpecificInformation.forEach((sspi: SpeciesSpecificPhenophaseInformation) => {
            for (var abundanceCategory of sspi.abundanceCategories) {
                if (!abundanceCategory) {
                    console.log('check me');
                }
                abundanceCategories.push(abundanceCategory);
            }
        });
        return abundanceCategories;
    }

    private getAbundanceValues(abundanceCategories: AbundanceCategory[]): AbundanceValue[] {
        // console.log('in getAbundanceValues');
        let abundanceValues = [];
        if(abundanceCategories) {
            // console.log(abundanceCategories.length);
            abundanceCategories.forEach(abundanceCategory => {
                // console.log(JSON.stringify(abundanceCategory));
                for( let abundanceValue of abundanceCategory.abundanceValues) {
                    abundanceValues.push(abundanceValue);
                }
            });
        }
        return abundanceValues;
    }

    getPhenophasesForSelectedIndividual(selectedIndividual): Phenophase[] {
        let phenophases = [];
        if (selectedIndividual && selectedIndividual.species && selectedIndividual.species.speciesProtocols) {
            for (var speciesProtocol of selectedIndividual.species.speciesProtocols) {
                if (!speciesProtocol.dataset_id
                    && ((!speciesProtocol.end_date && new Date(speciesProtocol.start_date).getTime() < this.observationDate.getTime())
                    || (new Date(speciesProtocol.start_date).getTime() < this.observationDate.getTime()
                    && new Date(speciesProtocol.end_date).getTime() > this.observationDate.getTime())))
                    for (var protocolPhenophase of speciesProtocol.protocolPhenophases) {
                        let phenophaseForProtocol: Phenophase = protocolPhenophase.phenophase;
                        phenophaseForProtocol.protocol_id = protocolPhenophase.protocol_id;
                        phenophaseForProtocol.seq_num = protocolPhenophase.seq_num;

                        phenophaseForProtocol.phenophaseDefinition = this._phenophaseService.getActivePhenophaseDefinition(phenophaseForProtocol, this.observationDate)[0];

                        phenophases.push(phenophaseForProtocol);
                    }
            }
        }
        phenophases.sort(function(a, b) {
            return a.seq_num - b.seq_num;
        });
        return phenophases;
    }

    async markPhenophasesFromObservations(selectedIndividual, phenophases, observations) {
        this.comments = "";
        let commentSet = false;
        for (var phenophase of phenophases) {

            let sspi = this._sspiService.getSpeciesSpecificPhenophaseInformationForDate(this.selectedIndividual, phenophase, this.observationDate);
            if(sspi.length > 0) {
                phenophase.extent_min = sspi[0].extent_min;
                phenophase.extent_max = sspi[0].extent_max;
            }
            phenophase.abundanceCategories = this.getAbundanceCategories(sspi);
            phenophase.abundanceValues = this.getAbundanceValues(phenophase.abundanceCategories);

            phenophase.notSureSelected = false;
            phenophase.noSelected = false;
            phenophase.yesSelected = false;
            phenophase.abundanceValue = null;
            phenophase.intensity = null;
            for (var observation of observations) {
                if (observation.phenophase_id === phenophase.phenophase_id) {
                    if(!commentSet) {
                        this.comments  = observation.comment;
                        commentSet = true;
                    }
                    if (!observation.deleted) {
                        phenophase.notSureSelected = observation.observation_extent === -1;
                            phenophase.noSelected = observation.observation_extent === 0;
                        phenophase.yesSelected = observation.observation_extent === 1;
                        phenophase.intensity = observation.raw_abundance_value;
                        //set the abundance value
                        if (observation.abundance_category != null && observation.abundance_category_value != null) {
                            for (var abundanceValue of phenophase.abundanceValues) {
                                if (abundanceValue.abundance_value_id === observation.abundance_category_value) {
                                    phenophase.abundanceValue = abundanceValue;
                                }
                            }
                        }
                    }
                }
            }
        }
        // the concatted empty phenophase below is used as a placeholder to put the mark all no
        // button in the listview, it is always filtered out of obs logic by checking for empty phenophase_id
        this.phenophases = phenophases;
        this.phenophasesWithMarkAllNo = [(new Phenophase())].concat(phenophases).concat([(new Phenophase())]);
    }

    async setPhenophaseDataFromObservations(selectedIndividual) {
        if(!this.selectedIndividual)
            return;
        console.log('setPhenophaseDataFromObservations');
        let phenophases = await this.getPhenophasesForSelectedIndividual(selectedIndividual);
        this.observations = await this._observationService.getObservationsForIndividualAtTime(selectedIndividual, this.observationDate);
        this.markPhenophasesFromObservations(selectedIndividual, phenophases, this.observations);
    }

    saveButtonTapped() {
        this.tappedSaveButton = true;
        setTimeout(()=> this.tappedSaveButton = false, 2000);
        this.saveObservations();
    }

    async saveObservations(cont = () => {}) {
        let savedSomeData = false;

        // no need to save if there isn't a selected individual
        if (!this.selectedIndividual)
            return;

        // make sure observationGroup server id is up to date
        await this._observationGroupsService.setSelectedObservationGroup(this.observationDate, this._sitesService.selectedSite, this._peopleService.selectedPerson);

        let newObservationsAdded: Observation[] = [];
        for (var phenophase of this.phenophases) {
            let observationExtent = null;
            if (phenophase.notSureSelected) {
                observationExtent = -1;
            } else if (phenophase.noSelected) {
                observationExtent = 0;
            } else if (phenophase.yesSelected) {
                observationExtent = 1;
            } else {
                observationExtent = null;
            }

            let foundObservationForPhenophase = false;
            for (var observation of this.observations) {
                if (observation.phenophase_id === phenophase.phenophase_id) {
                    foundObservationForPhenophase = true;
                    observation.observation_group_id = this._observationGroupsService.selectedObservationGroup.observation_group_id;
                    if (observationExtent == null) {
                        observation.deleted = 1;
                    } else {
                        observation.deleted = 0;
                        observation.observation_extent = observationExtent;
                        observation.abundance_category_value = phenophase.abundanceValue ? phenophase.abundanceValue.abundance_value_id : null;
                        observation.abundance_category = phenophase.abundanceCategories.length > 0 ? phenophase.abundanceCategories[0].abundance_category_id : null
                        observation.raw_abundance_value = phenophase.intensity ? phenophase.intensity : null;
                    }
                    observation.comment = this.comments;
                    observation.timestamp = new Date().getTime();
                    let alreadyUpToDate = await this._observationService.dbObservationSameAsModel(observation);
                    if (!alreadyUpToDate) {
                        console.log(`UPDATING OBSERVATION ${observation.local_id}!`);
                        await this._observationService.updateObservation(observation);
                        savedSomeData = true;
                    } else {
                        console.log(`not saving because ${observation.local_id} is already up to date`);
                        savedSomeData = true;
                    }
                }
            }
            if (!foundObservationForPhenophase && observationExtent != null) {
                //create and save new observation
                
                let  newObservation: Observation = new Observation(
                    this._peopleService.selectedPerson.person_id,
                    phenophase.phenophase_id,
                    observationExtent,
                    this.comments,
                    this.selectedIndividual.individual_id,
                    this.selectedIndividual.local_id,
                    this._observationGroupsService.selectedObservationGroup.observation_group_id,
                    this._observationGroupsService.selectedObservationGroup.local_id,
                    phenophase.protocol_id,
                    phenophase.intensity,
                    phenophase.abundanceCategories.length > 0 ? phenophase.abundanceCategories[0].abundance_category_id : null,
                    phenophase.abundanceValue ? phenophase.abundanceValue.abundance_value_id : null,
                    this.observationDate.toISOString()
                );
                console.log('INSERTING NEW OBSERVATION!');
                let local_id = await this._observationService.insertObservation(newObservation);
                savedSomeData = true;
                newObservation.local_id = local_id;
                newObservationsAdded = newObservationsAdded.concat(newObservation);
            }
        }
        // console.log('new obs');
        // console.log(JSON.stringify(newObservationsAdded));
        this.observations = this.observations.concat(newObservationsAdded);
        // console.log('all obs');
        // console.log(JSON.stringify(this.observations));
        // console.log('finished saving abs ind');
        if(savedSomeData) {
            this.dataSaved = true;
            //setTimeout(()=> this.dataSaved = false, 2000);
        }
    }

    setAllToNo() {
        this.dataTouched = true;
        this.dataSaved = false;
        for (var phenophase of this.phenophases) {
            phenophase.noSelected = true;
            phenophase.yesSelected = false;
            phenophase.notSureSelected = false;
            phenophase.abundanceValue = null;
            phenophase.intensity = null;
        }
    }

    onCommentsChange(event) {
        this.dataTouched = true;
        this.dataSaved = false;
    }

    abstract ngOnInit();
    abstract ngOnDestroy();
}