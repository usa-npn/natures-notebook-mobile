import {Component} from '@angular/core';
import {ModalDialogParams} from "nativescript-angular/modal-dialog";
import { SwipeGestureEventData } from "ui/gestures";
import {SitesService} from "../../../shared/sites/sites.service";
import {Network} from "../../../shared/networks/network";
import {Person} from "../../../shared/people/person";

@Component({
    moduleId: module.id,
    selector: 'site-creation-modal-content',
    template: `
        <FlexboxLayout flexDirection="column">
            <FlexboxLayout flexDirection="column" class="picker-header-stack">
                <Label text="Create New Site"></Label>
            </FlexboxLayout>
            <FlexboxLayout flexDirection="column" (swipe)="cancel()" padding="2">

                <FlexboxLayout flexDirection="column" justifyContent="space-around" class="bordered-box" alignItems="stretch" padding="2" height="100">
                    <Label text='Provide a name for the new site:' textAlignment="center"></Label>
                    <TextField [(ngModel)]='siteName' hint="site name" textAlignment="center"></TextField>
                </FlexboxLayout>
                
                <FlexboxLayout justifyContent="space-between">
                    <Button text="Cancel" (tap)="cancel()" flexGrow="1"></Button>
                    <Button text="Continue" (tap)="validateAndContinue()" flexGrow="1"></Button>
                </FlexboxLayout>
            </FlexboxLayout>
        </FlexboxLayout>
    `,
    styleUrls: ["../sites-common.scss"]
})
export class SiteCreationModal {
    private selectedGroup: Network;
    private selectedPerson: Person;
    public siteName: string;
    constructor(private params: ModalDialogParams,
                private _sitesService: SitesService) {
        this.selectedPerson = params.context.selectedPerson;
        this.selectedGroup = params.context.selectedGroup;
    }

    public cancel() {
        this.params.closeCallback('cancel');
    }

    public async validateAndContinue() {
        let pattern = /^[a-zA-Z0-9,\s-_()']*$/;
        if (!this.siteName || this.siteName.length < 1) {
            alert('You must enter a site name to continue.');
            return;
        } else if (this.siteName.length > 62) {
            alert('Site names must not exceed 64 characters.');
            return;
        } else if (!pattern.test(this.siteName)) {
            alert('Site names can only contain letters, numbers, commas, whitespace, dashes, underscores parentheses or apostrophes.');
            return;
        }

        // check the remote database to make sure the site name doesn't already exist
        try {
            let siteFound = await this._sitesService.siteNameAlreadyExists(this.siteName, this.selectedGroup, this.selectedPerson);
            if (siteFound) {
                alert('That site name is already used, please choose another name.');
            } else {
                this.params.closeCallback(this.siteName);
            }
        } catch (error) {
            console.log(error);
            alert('You must have internet connectivity to add a site.')
        }


    }
}