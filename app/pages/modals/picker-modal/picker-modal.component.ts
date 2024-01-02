import {Component, OnInit} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import { SwipeGestureEventData } from "@nativescript/core/ui/gestures";
import {Individual} from "../../../shared/individuals/individual";
import {Page} from "@nativescript/core/ui/page";
import { Color } from '@nativescript/core/color';
import {PickerSearchPipe} from "./picker-search.pipe";
import {Site} from "../../../shared/sites/site";
import {Network} from "../../../shared/networks/network";
import {State} from "../../sites/states";
import {icons} from "../../icons";
import {AbundanceValue} from "../../../shared/phenophases/abundance-value";
import { AbstractModal } from '../abstract-modal/abstract-modal';
import { ModelService } from '~/shared/model/model.service';

@Component({
    moduleId: module.id,
    selector: 'modal-content-individual-picker',
    templateUrl: "./picker-modal.html",
    styleUrls: ["../modals-common.scss"],
    providers: [PickerSearchPipe]
})
export class PickerModal extends AbstractModal {

    public searchIcon = icons.searchIcon;
    public items: Individual[] | Site[] | Network[] | State[] | AbundanceValue[] | string[] = [];
    public selectedItem: Individual | Site | Network | State | AbundanceValue | string;
    public title: string;
    public subtitle: string;
    public searchPhrase: string = "";
    public searchHint: string = "";
    public pickerType;
    public showSearchBox: boolean = false;

    constructor(private params: ModalDialogParams,
                private page:Page,
                public pickerSearchPipe: PickerSearchPipe) {
        super(page, params.context.modelService);
        page.backgroundColor = new Color(50, 0, 0, 0);

        this.items = params.context.items;
        this.selectedItem = params.context.selectedItem;
        this.title = params.context.title;
        this.subtitle = params.context.subtitle;
        this.pickerType = params.context.pickerType;
        if(this.pickerType === 'individual') {
            this.searchHint = 'search by individual name';
            this.showSearchBox = true;
        } else if(this.pickerType === 'site') {
            this.searchHint = 'search by site name';
            this.showSearchBox = true;
        } else if(this.pickerType === 'group') {
            this.searchHint = 'search by group name';
            this.showSearchBox = true;
        } else if(this.pickerType === 'state') {
            this.searchHint = 'search by State';
            this.showSearchBox = true;
        } else if(this.pickerType === 'surveymethod') {
            this.searchHint = 'search by survey method';
            this.showSearchBox = false;
        } else if(this.pickerType === 'abundance') {
            this.searchHint = 'search by abundance';
            this.showSearchBox = false;
        }
    }

    public isSelected(item : Individual | Site | Network | State | AbundanceValue | string) {
        if (this.selectedItem && this.pickerType === 'individual') {
            return (<Individual>this.selectedItem).individual_userstr === (<Individual>item).individual_userstr;
        } else if (this.selectedItem && this.pickerType === 'site') {
            return (<Site>this.selectedItem).station_name === (<Site>item).station_name;
        } else if (this.selectedItem && this.pickerType === 'group') {
            return (<Network>this.selectedItem).name === (<Network>item).name;
        } else if (this.selectedItem && this.pickerType === 'state') {
            return (<State>this.selectedItem).state_code === (<State>item).state_code;
        } else if (this.selectedItem && this.pickerType === 'surveymethod') {
            return (<string>this.selectedItem) === (<string>item);
        } else if (this.selectedItem && this.pickerType === 'abundance') {
            return (<AbundanceValue>this.selectedItem).short_name === (<AbundanceValue>item).short_name;
        }
        else {
            return false;
        }
    }

    public getItemDisplayText(item: Individual | Site | Network | State | AbundanceValue | string) {
        if (this.pickerType === 'individual') {
            return (<Individual>item).individual_userstr;
        } else if (this.pickerType === 'site') {
            return (<Site>item).station_name;
        } else if (this.pickerType === 'group') {
            return (<Network>item).name;
        } else if (this.pickerType === 'state') {
            return (<State>item).state_name;
        } else if (this.pickerType === 'surveymethod') {
            return (<string>item);
        } else if (this.pickerType === 'abundance') {
            return (<AbundanceValue>item).short_name;
        }
    }

    // public tableLoaded(args) {
    //     args._ios.rowHeight = UITableViewAutomaticDimension;
    //     args._ios.estimatedRowHeight = 50;
    // }

    public closePicker(individual) {
        this.params.closeCallback(individual);
    }

    public cancel() {
        super.cancel();
        this.params.closeCallback(this.selectedItem);
    }
}