import {
    Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectionStrategy,
    ViewContainerRef, OnDestroy
} from "@angular/core";
import {Species} from "../../../shared/species/species";
import {SpeciesService} from "../../../shared/species/species.service";
var http = require("http");
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular";
import {Individual} from "../../../shared/individuals/individual";
import {IndividualsService} from "../../../shared/individuals/individuals.service";
import {Phenophase} from "../../../shared/phenophases/phenophase";
import {ObservationGroupsService} from "../../../shared/observation-groups/observation-groups.service";
import {Subscription} from "rxjs";
import {AnimalsPipe} from "../animals.pipe";
import {ObservationGroup} from "../../../shared/observation-groups/observation-group";
import {ObserveService} from "../observe.service";
import {Observation} from "../../../shared/observations/Observation";
import {ObservationsService} from "../../../shared/observations/observations.service";
import {PeopleService} from "../../../shared/people/people.service";
import {icons} from "../../icons";
import {PickerModal} from "../../modals/picker-modal/picker-modal.component";
import {SitesService} from "../../../shared/sites/sites.service";
import {ToolTipModal} from "../modals/tooltip";
import {Page} from "tns-core-modules/ui/page";
import { AnimalPhenophasesModal } from "../modals/animals/animals.component";
import { SyncService } from "../../../shared/sync/sync.service";
import { SettingsService } from "../../../shared/settings/settings.service";
import { PhenophasesService } from "../../../shared/phenophases/phenophases.service";
import { NetworksService } from "../../../shared/networks/networks.service";

@Component({
    moduleId: module.id,
    selector: "animals-checklist",
    templateUrl: "./animals-checklist.html",
    styleUrls: [
        "../observe-common.scss",
        "./animals-checklist-common.scss"
    ],
    providers: [AnimalsPipe]
})
export class AnimalsChecklistComponent implements OnInit, AfterViewInit, OnDestroy {

    constructor(protected modalService: ModalDialogService,
                private viewContainerRef: ViewContainerRef,
                private _speciesService: SpeciesService,
                private _sitesService: SitesService,
                private _router: Router,
                private _individualsService: IndividualsService,
                private _networksService: NetworksService,
                private _observationGroupsService: ObservationGroupsService,
                private _observeService: ObserveService,
                private _observationService: ObservationsService,
                private _peopleService: PeopleService,
                private _settingsService: SettingsService,
                private _syncService: SyncService,
                private _phenophaseService: PhenophasesService,
                private page:Page
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
    checkmarkIcon = icons.checkmarkIcon;
    dataSaved: boolean = false;
    tappedSaveButton: boolean = false;
    comments = "";
    individualphenophaseMap: Map<number, Phenophase[]> = new Map();

    @ViewChild("animalListView", {static: false}) animalListView: ElementRef;

    public animals: Individual[] = [];
    public observationDate: Date;
    selectedObservationGroup: ObservationGroup = new ObservationGroup(this._settingsService.recordObservationTime);

    async changeAnimalSelection(animal: Individual, selector: string) {
        let phenophases: Phenophase[] = this.individualphenophaseMap.get(animal.individual_id);
        if (selector === 'no') {
            animal.notPresent = !animal.notPresent;
            if(animal.notPresent) {
                animal.observed = false;
            }
            for(let phenophase of phenophases) {
                phenophase.noSelected = animal.notPresent;
                phenophase.abundanceValue = null;
                phenophase.intensity = null;
            }
            await this.saveObservations(animal, phenophases);
            this._syncService.syncObservations();
            this.dataSaved = false; // data really was saved, but on interface want user to be able to click 'Save Data'
        } else {
            this.popupAnimalPheophases(animal);
        }
    }

    async popupAnimalPheophases(animal) {
        this._individualsService.selectedIndividual = animal;
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                phenophases: this.individualphenophaseMap.get(animal.individual_id),
                selectedIndividual: animal
            },
            fullscreen: true
        };
        this.modalService.showModal(AnimalPhenophasesModal, options).then((phenophases) => {
            if(phenophases) { // needed incase android back button pressed
                let foundPhenophaseWithoutObservation = false;
                let foundPhenophaseWithNoObservation = false;
                let foundPhenophaseWithYesOrQuestion = false;
                for (let phenophase of phenophases) {
                    if(phenophase.yesSelected || phenophase.notSureSelected) {
                        foundPhenophaseWithYesOrQuestion = true;
                        break;
                    } else if(!phenophase.noSelected && !phenophase.yesSelected && !phenophase.notSureSelected) {
                        foundPhenophaseWithoutObservation = true;
                    } else if(phenophase.noSelected) {
                        foundPhenophaseWithNoObservation = true;
                    }
                }
                if (foundPhenophaseWithYesOrQuestion || (foundPhenophaseWithoutObservation && foundPhenophaseWithNoObservation)) {
                    this._individualsService.selectedIndividual.observed = true;
                    this._individualsService.selectedIndividual.notPresent = false;
                } else if (foundPhenophaseWithoutObservation) { // no Y, ? and at least one empty obs
                    this._individualsService.selectedIndividual.observed = false;
                    this._individualsService.selectedIndividual.notPresent = false;
                } else { // all are marked N
                    this._individualsService.selectedIndividual.observed = false;
                    this._individualsService.selectedIndividual.notPresent = true;
                }
                this._syncService.syncObservations();
            }
            this.dataSaved = true;
        });
    }

    async saveObservations(selectedIndividual: Individual, phenophases: Phenophase[]) {
        let savedSomeData = false;
        let observations: Observation[] = await this._observationService.getObservationsForIndividualAtTime(selectedIndividual, this.observationDate);
        
        // make sure observationGroup server id is up to date
        await this._observationGroupsService.setSelectedObservationGroup(this.observationDate, this._sitesService.selectedSite, this._peopleService.selectedPerson);

        for (let phenophase of phenophases) {
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
            for (var observation of observations) {
                if (observation.phenophase_id === phenophase.phenophase_id) {
                    foundObservationForPhenophase = true;
                    observation.observation_group_id = this._observationGroupsService.selectedObservationGroup.observation_group_id;
                    if(observationExtent != null) {
                        observation.observation_extent = observationExtent;
                        observation.deleted = 0;
                    } else {
                        observation.deleted = 1
                    }
                    observation.abundance_category_value = phenophase.abundanceValue ? phenophase.abundanceValue.abundance_value_id : null;
                    observation.comment = this.comments;
                    observation.raw_abundance_value = phenophase.intensity ? phenophase.intensity : null;
                    observation.timestamp = new Date().getTime();
                    let alreadyUpToDate = await this._observationService.dbObservationSameAsModel(observation);
                    if (!alreadyUpToDate) {
                        console.log(`UPDATING OBSERVATION ${observation.local_id}!`);
                        await this._observationService.updateObservation(observation);
                        savedSomeData = true;
                    } else {
                        console.log(`not saving because ${observation.local_id} is already up to date`);
                    }
                }
            }
            if (!foundObservationForPhenophase) {
                //create and save new observation
                let observationGroup = this._observationGroupsService.selectedObservationGroup;

                let  newObservation: Observation = new Observation(
                    this._peopleService.selectedPerson.person_id,
                    phenophase.phenophase_id,
                    observationExtent,
                    this.comments,
                    selectedIndividual.individual_id,
                    selectedIndividual.local_id,
                    observationGroup.observation_group_id,
                    observationGroup.local_id,
                    phenophase.protocol_id,
                    phenophase.intensity,
                    (phenophase.abundanceCategories != null && phenophase.abundanceCategories.length) > 0 ? phenophase.abundanceCategories[0].abundance_category_id : null,
                    phenophase.abundanceValue ? phenophase.abundanceValue.abundance_value_id : null,
                    this.observationDate.toISOString()
                );
                console.log('INSERTING DATA!');
                let local_id = await this._observationService.insertObservation(newObservation);
                savedSomeData = true;
                newObservation.local_id = local_id;
            }
        }

        if(savedSomeData) {
            this.dataSaved = true;
            // setTimeout(()=> this.dataSaved = false, 2000);
        }
    }

    async markObservedAndNotPresent() {
        for (var individual of this.animals) {
            let observations: Observation[] = await this._observationService.getObservationsForIndividualAtTime(individual, this.observationDate);
            let phenophases = this.getPhenophasesForSelectedAnimal(individual);
            
            let foundNo = false;
            let foundYesOrNotSure = false;
            let foundPhenophaseWithoutObservation = false;
            for (var phenophase of phenophases) {
                let foundObservation = false;
                for (var observation of observations) {
                    if (observation.phenophase_id === phenophase.phenophase_id) {
                        if (observation.observation_extent === 1 || observation.observation_extent === -1) {
                            foundObservation = true;
                            foundYesOrNotSure = true;
                            break;
                        }
                        if (observation.observation_extent === 0) {
                            foundObservation = true;
                            foundNo = true;
                            break;
                        }
                    }
                }
                if(!foundObservation) {
                    foundPhenophaseWithoutObservation = true;
                }
                if(foundYesOrNotSure) {
                    break;
                }
            }
            if(foundYesOrNotSure || (foundPhenophaseWithoutObservation && foundNo)) {
                // highlight observered
                individual.observed = true;
                individual.notPresent = false;
            }
            else if(foundPhenophaseWithoutObservation) {
                // don't highlight observered or not present
                individual.observed = false;
                individual.notPresent = false;
            } else {
                // highlight not present (all phenophases were N)
                individual.observed = false;
                individual.notPresent = true;
            }
        }
    }

    getPhenophasesForSelectedAnimal(selectedIndividual): Phenophase[] {
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
        this.individualphenophaseMap.set(selectedIndividual.individual_id, phenophases);
        return phenophases;
    }

    public popupSurveyMethodPicker() {
        let surveyMethods = ["None", "Walking", "Stationary", "Area Search", "Incidental"];

        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                items: surveyMethods,
                selectedItem: this.selectedObservationGroup.method || "None",
                title: "Choose a survey method.",
                pickerType: "surveymethod"
            },
            fullscreen: true
        };

        this.modalService.showModal(PickerModal, options).then((selectedSurveyMethod: string) => {
            this.animalListView.nativeElement.refresh();
            if (selectedSurveyMethod) {
                if (selectedSurveyMethod === 'None') {
                    selectedSurveyMethod = null;
                }
                if (this.selectedObservationGroup.method != selectedSurveyMethod) {
                    this.selectedObservationGroup.method = selectedSurveyMethod;
                }
                this.dataSaved = false;
            }
        })
    }

    popupInfo(infoPressed) {
        let tipText = '';
        if(infoPressed == 'animal-survey-method')
            tipText = 'Choose your observation method: Incidental (chance sighting while not specifically searching), Stationary (standing or sitting at a single point), Walking (a single pass or transect through your site) or Area search (multiple passes through your site).';
        else if(infoPressed == 'time-spent-searching-animals')
            tipText = 'If you are observing animals, report the time you spent searching for animals (the recommended search time is 3 minutes). There is no need to report time for incidental sightings.';
        let options: ModalDialogOptions = {
            viewContainerRef: this.viewContainerRef,
            context: {
                tipText: tipText
            },
            fullscreen: true
        };
        this.modalService.showModal(ToolTipModal, options).then(() => {});
    }

    addAnimal() {
        this._router.navigate(["/individuals"]);
    }

    permissionToAddAnimals() {
        return this._networksService.isAdmin();
    }

    onTimeSpentSearchingChange(event) {
        this.dataSaved = false;
    }

    private subscriber: Subscription;
    ngOnInit() {
        this.dataSaved = false;
        this.animals = this._individualsService.animals.filter(ind => ind.active === 1);
    }

    // this method doesn't really save anything but is really just to make the user feel better,
    // all saves on the checklist occur automatically when a Y, N, ? button is tapped per individual
    // as it's much more optimized to do it this way
    async saveData() {
        // this.tappedSaveButton = true;
        this.dataSaved = true;
        await this.saveAndSync();
        // setTimeout(()=> this.tappedSaveButton = false, 2000);
    }

    async saveAndSync(cont = () => {}) {
        await this._observationGroupsService.updateObservationGroup(
            this.selectedObservationGroup
        );
        await this._syncService.syncObservations();
        cont();
    }

    showList = false;
    ngAfterViewInit() {
        setTimeout(() => {this.showList = true;}, 5);
        this.subscriber = this._observationGroupsService.selectedDate.subscribe(async (date: Date) => {
            if (date) {
                this.observationDate = date;
                await this._observationGroupsService.setSelectedObservationGroup(this.observationDate, this._sitesService.selectedSite, this._peopleService.selectedPerson);
                this.selectedObservationGroup = this._observationGroupsService.selectedObservationGroup;
                await this._individualsService.loadIndividualsPhenophaseInformation(this.animals);
                await this.markObservedAndNotPresent();
                if(this.animalListView) {
                    this.animalListView.nativeElement.refresh();
                }
                //auto popup animal phenophases if we came from animal tap on review obs screen
                if (this._individualsService.fromReviewScreen && this._individualsService.selectedIndividual) {
                    this._individualsService.fromReviewScreen = false;
                    this.popupAnimalPheophases(this._individualsService.selectedIndividual);
                }
            }
            this.dataSaved = false;
        });
    }

    ngOnDestroy() {
        this.saveAndSync();
        this.subscriber.unsubscribe();
    }
}
