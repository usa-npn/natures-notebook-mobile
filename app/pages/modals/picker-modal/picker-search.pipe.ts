import { Pipe, PipeTransform } from '@angular/core';
import {Individual} from "../../../shared/individuals/individual";
import {Site} from "../../../shared/sites/site";
import {Network} from "../../../shared/networks/network";
import {State} from "../../sites/states";

@Pipe({ name: 'pickerSearchPipe'})
export class PickerSearchPipe implements PipeTransform {
    transform(allItems: Individual[] | Site[] | Network[] | State[] | string[], searchText: string, pickerType: string, showSearchBox: boolean) {
        if (!showSearchBox) {
            return allItems;
        }
        if (pickerType === 'individual') {
            return (<Individual[]>allItems).filter(item => {
                return (<Individual>item).individual_userstr.toLowerCase().includes(searchText.toLowerCase());
            });
        } else if (pickerType === 'site') {
            return (<Site[]>allItems).filter(item => {
                return (<Site>item).station_name.toLowerCase().includes(searchText.toLowerCase());
            });
        } else if (pickerType === 'group') {
            return (<Network[]>allItems).filter(item => {
                return (<Network>item).name.toLowerCase().includes(searchText.toLowerCase());
            });
        } else if (pickerType === 'state') {
            return (<State[]>allItems).filter(item => {
                return (<State>item).state_name.toLowerCase().includes(searchText.toLowerCase());
            });
        } else if (pickerType === 'surveymethod' || pickerType === 'abundance') {
            return (<string[]>allItems).filter(item => {
                return (<string>item).toLowerCase().includes(searchText.toLowerCase());
            });
        }
    }
}
