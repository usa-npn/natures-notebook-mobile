import {Component, OnInit} from '@angular/core';
import {ModalDialogParams} from "nativescript-angular/modal-dialog";
import { SwipeGestureEventData } from "ui/gestures";
import {Individual} from "../../../shared/individuals/individual";
import {Page} from "ui/page";
import { Color } from 'color';
import {Phenophase} from "../../../shared/phenophases/phenophase";
import {PhenophaseDefinition} from "../../../shared/phenophases/phenophase-definition";
import {SpeciesSpecificPhenophaseInformation} from "../../../shared/species/species-specific-phenophase-information";
import {AbundanceCategory} from "../../../shared/phenophases/abundance-category";
import {AbundanceValue} from "../../../shared/phenophases/abundance-value";

@Component({
    moduleId: module.id,
    selector: 'modal-content-phenophase-info',
    template: `
        <GridLayout class="picker-modal-full" columns="*" rows="auto,*,auto">
            <StackLayout class="phenophase-info-header-stack" row="0" column="0">
                <Label text="Phenophase definition"></Label>
            </StackLayout>
            <StackLayout class="phenophase-info-stack" row="1" column="0">
                <ScrollView>
                    <StackLayout>
                        <Label text="{{selectedPhenophase.phenophaseDefinition.phenophase_name}}" textWrap="true" class="phenophase-info-subsection-header"></Label>
                        <Label text="{{phenophaseDescription}}" textWrap="true" width="90%"></Label>
                        <Label *ngIf="speciesSpecificDescription !== ''"
                                text="Additional details for species '{{selectedPlant.species.common_name}}'" textWrap="true" class="phenophase-info-subsection-header"></Label>
                        <Label *ngIf="speciesSpecificDescription !== ''"
                                text="{{speciesSpecificDescription}}" textWrap="true" width="90%"></Label>
                        <Label *ngIf="abundanceCategoriesDescription !== ''" text="{{abundanceCategoriesDescription}}" textWrap="true" class="phenophase-info-subsection-header"></Label>
                        <Label *ngFor="let abundanceValue of abundanceValues" 
                                text="\u2022 {{abundanceValue.short_name}}{{abundanceValue.abundance_value ? ': ' + abundanceValue.abundance_value : ''}}" textWrap="true" width="90%"></Label>
                                <Label *ngIf="forAnimal && abundanceCategoriesDescription == ''" text="Abundance" textWrap="true" class="phenophase-info-subsection-header"></Label>
                                <Label *ngIf="forAnimal && abundanceCategoriesDescription == ''" text="For abundance, enter the number of individual animals observed in this phenophase." textWrap="true" width="90%"></Label>
                    </StackLayout>
                </ScrollView>
            </StackLayout>
            <Button text="Close" (tap)="closeModal()" row="2" column="0"></Button>
        </GridLayout>
    `,
    styleUrls: ["../plants/plants-common.scss"]
})
export class PhenophaseInfoModal implements OnInit{
    public forAnimal = false;
    public selectedPlant: Individual;
    public selectedPhenophase: Phenophase;
    public selectedDate: Date;
    public phenophaseDescription:string = "";
    public speciesSpecificPhenophaseInformation: SpeciesSpecificPhenophaseInformation[];
    public speciesSpecificDescription:string = "";
    public abundanceCategories: AbundanceCategory[];
    public abundanceCategoriesDescription: string;
    public abundanceValues: AbundanceValue[];

    constructor(private params: ModalDialogParams,
                private page:Page) {
        page.backgroundColor = new Color(50, 0, 0, 0);
        this.selectedPlant = params.context.selectedPlant;
        this.selectedPhenophase = params.context.selectedPhenophase;
        this.selectedDate = params.context.selectedDate;
        this.forAnimal = params.context.forAnimal;
    }

    public closeModal() {
        this.params.closeCallback();
    }

    private activeDate(startDate: Date, endDate: Date): boolean {
        if(!startDate) {
            return false;
        }
        if (!endDate && startDate.getTime() < this.selectedDate.getTime()) {
            return true;
        }
        else if (startDate.getTime() < this.selectedDate.getTime() && endDate.getTime() > this.selectedDate.getTime()) {
            return true;
        }
        else {
            return false;
        }
    }

    private getSpeciesSpecificPhenophaseInformation(phenophase: Phenophase): SpeciesSpecificPhenophaseInformation[] {
        return this.selectedPlant.species.speciesSpecificPhenophaseInformation.filter(sspi => {
            return sspi.phenophase_id === phenophase.phenophase_id;
        }).filter((sspi: SpeciesSpecificPhenophaseInformation) => {
            const startDate = sspi.effective_datetime ? new Date(sspi.effective_datetime) : null;
            const endDate = sspi.deactivation_datetime ? new Date(sspi.deactivation_datetime) : null;
            return this.activeDate(startDate, endDate);
        });
    }

    private getPhenophaseDefinition(): string {
        return this.selectedPhenophase.phenophaseDefinition.definition.replace('<i>', '').replace('</i>', '');
    }

    private getSpeciesSpecificPhenophaseAdditionalDefinition(speciesSpecificPhenophaseInformation: SpeciesSpecificPhenophaseInformation[]): string {
        return speciesSpecificPhenophaseInformation.map((sspi: SpeciesSpecificPhenophaseInformation) => sspi.additional_definition)
            .join().replace('<i>', '').replace('</i>', '');
    }

    private getAbundanceCategories(speciesSpecificInformation: SpeciesSpecificPhenophaseInformation[]): AbundanceCategory[] {
        let abundanceCategories = [];
        speciesSpecificInformation.forEach((sspi: SpeciesSpecificPhenophaseInformation) => {
            for (var abundanceCategory of sspi.abundanceCategories) {
                abundanceCategories.push(abundanceCategory);
            }
        });
        return abundanceCategories;
    }

    private getAbundanceValues(abundanceCategories: AbundanceCategory[]): AbundanceValue[] {
        let abundanceValues = [];
        abundanceCategories.forEach(abundanceCategory => {
            for( var abundanceValue of abundanceCategory.abundanceValues) {
                abundanceValues.push(abundanceValue);
            }
        });
        return abundanceValues;
    }

    ngOnInit() {
        this.speciesSpecificPhenophaseInformation = this.getSpeciesSpecificPhenophaseInformation(this.selectedPhenophase);
        this.phenophaseDescription = this.getPhenophaseDefinition();
        this.speciesSpecificDescription = this.getSpeciesSpecificPhenophaseAdditionalDefinition(this.speciesSpecificPhenophaseInformation);
        this.abundanceCategories = this.getAbundanceCategories(this.speciesSpecificPhenophaseInformation);
        this.abundanceCategoriesDescription = this.abundanceCategories.map(abundanceCategory => abundanceCategory.description).join();
        this.abundanceValues = this.getAbundanceValues(this.abundanceCategories);
    }

}