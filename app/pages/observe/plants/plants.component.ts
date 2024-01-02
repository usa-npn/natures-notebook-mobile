import {IndividualsAbstractComponent} from "../individuals-abstract.component";
import {ModalDialogParams} from "@nativescript/angular";
import {Component} from "@angular/core";
import { Phenophase } from "~/shared/phenophases/phenophase";
@Component({
    moduleId: module.id,
    selector: "plants",
    templateUrl: "./plants.html",
    styleUrls: [
        "../observe-common.scss",
        "./plants-common.scss"
    ]
})
export class PlantsComponent extends IndividualsAbstractComponent {

    async selectNextPlant() {
        var t3 = new Date().getTime();
        await this.saveObservations();
        var t4 = new Date().getTime();
        console.log('save obs time: ' + (t4 - t3));

        let index = 0;
        for (var plant of this.individuals) {
            index += 1;
            if (this.selectedIndividual.individual_id === plant.individual_id) {
                break;
            }
        }
        // loop back to beginning
        if (index == this.individuals.length) {
            index = 0;
        }
        var t1 = new Date().getTime();
        this.selectedIndividual = this.individuals[index];
        await this._individualsService.loadIndividualsPhenophaseInformation([this.selectedIndividual]);
        var t2 = new Date().getTime();
        console.log('get ind phenophase info time: ' + (t2 - t1));
        var t5 = new Date().getTime();
        this.setPhenophaseDataFromObservations(this.selectedIndividual);
        var t6 = new Date().getTime();
        console.log('setphenophase data from obs time: ' + (t6 - t5));
        await this._syncService.syncObservations();
        var t7 = new Date().getTime();
        console.log('sync time: ' + (t7 - t6));
        this.dataSaved = false;
    }

    // getPhenophasesWithMarkAllRow(){
    //    return [(new Phenophase())].concat(this.phenophases);
    // }

    showList = false;
    async ngOnInit() {
        this.phenophasesWithMarkAllNo = [new Phenophase()].concat(this.phenophases);
        this.showList = true;
        // setTimeout(() => {this.showList = true;}, 5);
        console.log('in plants init');
        this.individuals = this._individualsService.plants.filter(ind => ind.active === 1);

        // when coming from the review screen we want to select the plant that was tapped
        // in all other cases we want to select the first plant in the list
        if(!this._individualsService.fromReviewScreen) { 
            this.selectedIndividual = this.individuals[0];
        } else {
            this.selectedIndividual = this._individualsService.selectedIndividual;
            this._individualsService.fromReviewScreen = false;
        }

        

        if (this.individuals.length > 0)
            await this._individualsService.loadIndividualsPhenophaseInformation([this.selectedIndividual]);
        this.dateSubscriber = this._observationGroupsService.selectedDate.subscribe((date: Date) => {
            console.log('got selectedDate');
            this.observationDate = date;
            if(this.observationDate != null) {
                this.setPhenophaseDataFromObservations(this.selectedIndividual);
            }
            this.dataSaved = false;
        });
    }

    async ngOnDestroy() {
        await this.saveObservations();
        await this._syncService.syncObservations();
        this.dateSubscriber.unsubscribe();
    }
}
