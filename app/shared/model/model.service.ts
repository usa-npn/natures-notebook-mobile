import { DatabaseService } from "../database/database.service";
import { Individual } from "../individuals/individual";
import { IndividualsService } from "../individuals/individuals.service";
import { Injectable } from "@angular/core";
import { Network } from "../networks/network";
import { NetworkPeopleService } from "../networks/network-people.service";
import { NetworkPerson } from "../networks/network-person";
import { NetworksService } from "../networks/networks.service";
import { Observable, Subject } from "rxjs";
import { Observation } from "../observations/Observation";
import { ObservationGroupsService } from "../observation-groups/observation-groups.service";
import { ObservationsService } from "../observations/observations.service";
import { PeopleService } from "../people/people.service";
import { Person } from "../people/person";
import { Site } from "../sites/site";
import { SitesService } from "../sites/sites.service";
import { SpeciesService } from "../species/species.service";

@Injectable()
export class ModelService {
  public BASE_MEDIA_URL = "https://www.usanpn.org/files/shared/";

  constructor(
    private _speciesService: SpeciesService,
    private _sitesService: SitesService,
    private _networksService: NetworksService,
    private _networkPeopleService: NetworkPeopleService,
    private _peopleService: PeopleService,
    private _individualsService: IndividualsService,
    private _observationGroupsService: ObservationGroupsService,
    private _observationService: ObservationsService,
    private _databaseService: DatabaseService
  ) {}

  public modalStatus = new Subject<string>();
  public androidBackButtonPressed = new Subject<string>();
 
  public async loadModel(reloadPeople: boolean) {
    if (reloadPeople) {
      this._peopleService.people = await this._peopleService.getFromDatabase<Person>();
      this._peopleService.loadPeopleTokens();
      for (let person of this._peopleService.people) {
        person.selected = false;
      }
    }
    await this._networksService.loadPersonToNetworksMap();
    await this._networksService.loadNetworksForPerson(
      this._peopleService.selectedPerson
    );
    await this._sitesService.loadSitesForPerson(
      this._peopleService.selectedPerson,
      this._networksService.selectedNetwork
    );
    await this._individualsService.loadIndividualsForSite(
      this._sitesService.selectedSite
    );
    this._peopleService.newAccountAdded = false;
  }
}
