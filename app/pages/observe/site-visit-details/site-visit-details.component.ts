import {
    Component,
    ViewChild,
    ElementRef,
    OnInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ViewContainerRef, OnDestroy
} from "@angular/core";
var http = require("http");
import {Router} from "@angular/router";
import {ModalDialogOptions, ModalDialogService} from "nativescript-angular";
import {ObservationGroupsService} from "../../../shared/observation-groups/observation-groups.service";
import {Subscription} from "rxjs";
import {SwipeGestureEventData} from "ui/gestures";
import {ObservationGroup} from "../../../shared/observation-groups/observation-group";
import {icons} from "../../icons";
import {PickerModal} from "../../modals/picker-modal/picker-modal.component";
import {SitesService} from "../../../shared/sites/sites.service";
import {PeopleService} from "../../../shared/people/people.service";
import {IndividualsService} from "../../../shared/individuals/individuals.service";
import {SettingsService} from "../../../shared/settings/settings.service";
import {ToolTipModal} from "../modals/tooltip";
import { SyncService } from "../../../shared/sync/sync.service";

@Component({
  moduleId: module.id,
  selector: "siteVisitDetails",
  templateUrl: "./site-visit-details.html",
  styleUrls: ["./site-visit-details-common.scss"],
  providers: []
})
export class SiteVisitDetailsComponent implements OnInit, OnDestroy {
  constructor(
    private modalService: ModalDialogService,
    private viewContainerRef: ViewContainerRef,
    private _observationGroupsService: ObservationGroupsService,
    private _sitesService: SitesService,
    private _peopleService: PeopleService,
    private _individualsService: IndividualsService,
    private _settingsService: SettingsService,
    private _syncService: SyncService,
    private _router: Router
  ) {}

  activeTab = "site-visit-details";
  calendarIcon = icons.calendarIcon;
  clockIcon = icons.clockIcon;
  infoIcon = icons.infoIcon;
  dropdownIcon = icons.dropdownIcon;
  radioCheckedIcon = icons.radioCheckedIcon;
  radioUncheckedIcon = icons.radioUncheckedIcon;
  notificationIcon = icons.notificationIcon;
  checkmarkIcon = icons.checkmarkIcon;

  observationDate: Date;
  selectedObservationGroup: ObservationGroup = new ObservationGroup(this._settingsService.recordObservationTime);
  dataSaved: boolean = true;
  dirtyData: boolean = false;

  public snowToolTip = `Reporting whether or not snow is present on the ground or treetops is useful to scientists who use satellite images to study plant cover. Since sunlight reflected off snow can look the same as bright green leaves in these images, your reports can eliminate some of the guesswork in interpreting satellite images. By comparing the ground observations you take at your site to a satellite image of the area that includes your site, these scientists can "ground truth" or "validate" the images, and therefore become better at interpreting other images across the globe.`;

  popupInfo(infoPressed) {
    let tipText = "";
    if (
      infoPressed == "snow-in-tree-tops" ||
      infoPressed == "percent-ground-covered"
    )
      tipText = `Reporting whether or not snow is present on the ground or treetops is useful to scientists who use satellite images to study plant cover. Since sunlight reflected off snow can look the same as bright green leaves in these images, your reports can eliminate some of the guesswork in interpreting satellite images. By comparing the ground observations you take at your site to a satellite image of the area that includes your site, these scientists can "ground truth" or "validate" the images, and therefore become better at interpreting other images across the globe.`;
    else if (infoPressed == "animal-survey-method")
      tipText =
        "Choose your observation method: Incidental (chance sighting while not specifically searching), Stationary (standing or sitting at a single point), Walking (a single pass or transect through your site) or Area search (multiple passes through your site).";
    else if (infoPressed == "time-spent-searching-animals")
      tipText =
        "If you are observing animals, report the time you spent searching for animals (the recommended search time is 3 minutes). There is no need to report time for incidental sightings.";
    else if (infoPressed == "time-spent-in-travel")
      tipText =
        "Please report your contribution of time in travel to help us estimate our program's volunteer effort.";
    else if (infoPressed == "time-observing")
      tipText =
        "Please report your contribution of time observing to help us estimate our program's volunteer effort.";
    else if (infoPressed == "site-comments")
      tipText =
        "Please report any additional comments about your site visit.";
    else if (infoPressed == "num-observers-looking-for-animals")
      tipText =
        "Please report the number of observers searching for animals during this site visit. When more than one observer contributes to the search for and count of individual animals on a site visit, it affects the statistical probability of detection during the time spent searching. This is important to take into account for some types of analysis of animal observation data.";

    let options: ModalDialogOptions = {
      viewContainerRef: this.viewContainerRef,
      context: {
        tipText: tipText
      },
      fullscreen: true
    };

    this.modalService.showModal(ToolTipModal, options).then(() => {});
  }

  toggleSnowOnGround(radioValue: boolean) {
    this.selectedObservationGroup.snow_ground = radioValue ? 1 : 0;
    this.dirtyData = true;
  }

  toggleSnowInTreeTops(radioValue) {
    this.selectedObservationGroup.snow_overstory_canopy = radioValue ? 1 : 0;
    this.dirtyData = true;
  }

  getSliderValueAsPercent() {
    // this.dataSaved = false;
    if (this.selectedObservationGroup.snow_ground_coverage != null)
      return (
        Math.floor(this.selectedObservationGroup.snow_ground_coverage) + "%"
      );
    else return "";
  }

  public popupSurveyMethodPicker() {
    let surveyMethods = [
      "None",
      "Walking",
      "Stationary",
      "Area Search",
      "Incidental"
    ];

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

    this.modalService
      .showModal(PickerModal, options)
      .then((selectedSurveyMethod: string) => {
        if (selectedSurveyMethod) {
          if (selectedSurveyMethod === "None") {
            selectedSurveyMethod = null;
          }
          if (this.selectedObservationGroup.method != selectedSurveyMethod) {
            this.selectedObservationGroup.method = selectedSurveyMethod;
            this.dirtyData = true;
          }
        }
      });
  }

  async saveObservationGroup() {
    if (this.dirtyData) {
      await this._observationGroupsService.updateObservationGroup(
        this.selectedObservationGroup
      );
      this.dirtyData = false;
      await this._syncService.syncObservations();
    }
    this.dataSaved = true;
  }

  async saveAndSync(cont = () => {}) {
    await this._observationGroupsService.updateObservationGroup(
      this.selectedObservationGroup
    );
    await this._syncService.syncObservations();
    cont();
  } 

  showList = false;
  private subscriber: Subscription;
  ngOnInit() {
    setTimeout(() => {this.showList = true;}, 5);
    this.dataSaved = false;
    this.dirtyData = false;
    this.subscriber = this._observationGroupsService.selectedDate.subscribe(
      async (date: Date) => {
        if (date) {
          this.observationDate = date;
          await this.saveAndSync();
          this.dataSaved = false;
          await this._observationGroupsService.setSelectedObservationGroup(
            date,
            this._sitesService.selectedSite,
            this._peopleService.selectedPerson
          );
          this.selectedObservationGroup = this._observationGroupsService.selectedObservationGroup;
          console.log("the selected obs group is: ");
          console.log(JSON.stringify(this.selectedObservationGroup));
        }
      }
    );
  }

  ngOnDestroy() {
    this.saveAndSync();
    this.subscriber.unsubscribe();
  }
}
