import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ModalDialogParams} from "nativescript-angular/modal-dialog";
import {PinchGestureEventData, SwipeGestureEventData} from "ui/gestures";
import {Individual} from "../../../shared/individuals/individual";
import {Page} from "ui/page";
import { Color } from 'color';
import {Species} from "../../../shared/species/species";
import {SpeciesPipe} from "./species.pipe";
import {Site} from "../../../shared/sites/site";
import {icons} from "../../icons";
import { NetworkMonitorService } from '../../../shared/network-monitor/network-monitor.service';
import { SpeciesService } from '~/shared/species/species.service';
var imageSource = require("image-source");
var fs = require("file-system");

@Component({
    moduleId: module.id,
    selector: 'new-individual-picker',
    templateUrl: "./new-individual-modal.html",
    styleUrls: ["../individuals-common.scss"],
    providers: [SpeciesPipe]
})
export class NewIndividualModal implements OnInit, AfterViewInit {
    dropdownIcon = icons.dropdownIcon;

    @ViewChild('searchField', {static: false}) searchField;
    @ViewChild('speciesImage', {static: false}) speciesImage;
    @ViewChild('rangeImage', {static: false}) rangeImage;

    public searchPhrase: string = "";
    public activeTab = 'common';
    public nickname: string;
    public nicknameError: string = "";
    public species: Species[] = [];
    public selectedSpecies: Species;
    public currentSiteIndividuals: Individual[];
    public BASE_MEDIA_URL = "https://www.usanpn.org/files/shared/";
    public IMAGE_PATH = "images/species/";
    public MAP_PATH = "maps/";
    public showPicker: boolean = false;
    public pickerIndex = 0;
    public speciesImageExists: boolean = false;
    public rangeImageExists: boolean = false;
    public currentSite: Site;

    constructor(private params: ModalDialogParams,
                private page:Page,
                private cdr: ChangeDetectorRef,
                private _networkMonitorService: NetworkMonitorService,
                private _speciesService: SpeciesService,
                private speciesPipe: SpeciesPipe) {
        page.backgroundColor = new Color(50, 0, 0, 0);

        this.currentSite = params.context.currentSite;
        this.currentSiteIndividuals = params.context.currentSiteIndividuals;
    }

    private openPicker() {
        this.searchPhrase = '';
        this.showPicker = true;
    }

    public closePicker(picker) {
        console.log('selected index');
        console.log(picker.index);
        let selectedIndex = picker.index;
        if (selectedIndex === undefined) {
            selectedIndex = 0;
        }
        this.pickerIndex = selectedIndex;
        this.selectedSpecies = this.speciesPipe.transform(this.species, this.searchPhrase, this.activeTab)[selectedIndex];
        this.updateNickname();
        this.showPicker = false;
        this.searchField.nativeElement.dismissSoftInput();
        this.cdr.detectChanges();
    }

    public cancelPicker() {
        this.selectedSpecies = this.speciesPipe.transform(this.species, this.searchPhrase, this.activeTab)[this.pickerIndex];
        this.updateNickname();
        this.showPicker = false;
        this.searchField.nativeElement.dismissSoftInput();
        this.cdr.detectChanges();
    }

    public getSpeciesName() {
        if (this.activeTab === 'common') {
            return this.selectedSpecies.common_name
        } else {
            return this.selectedSpecies.genus + ' ' + this.selectedSpecies.species;
        }
    }

    public showNicknameBox() :boolean {
        return !this.showPicker && this.selectedSpecies && this.selectedSpecies.kingdom != 'Animalia';
    }



    private enlargeSpeciesImage() {

    }

    private enlargeRangeImage() {

    }

    private async loadImages() {
        this.getSpeciesImage();
        this.getSpeciesMapImage();
    }

    private getSpeciesImage() {
        if(this.selectedSpecies) {
            this.speciesImageExists = true;
            let src = this.BASE_MEDIA_URL + this.IMAGE_PATH + this.selectedSpecies.genus + '_' + this.selectedSpecies.species;
            imageSource.fromUrl(src).then((res) => {
                this.speciesImage.nativeElement.src = src;
            }, (error) => {
                this.speciesImage.nativeElement.src = '~/images/no-image-available.png';
            });
        }
    }

    private getSpeciesMapImage() {
        if(this.selectedSpecies) {
            this.rangeImageExists = true;
            let src = this.BASE_MEDIA_URL + this.MAP_PATH + this.selectedSpecies.genus + '_' + this.selectedSpecies.species + "_map";
            imageSource.fromUrl(src).then((res) => {
                this.rangeImage.nativeElement.src = src;
            }, (error) => {
                this.rangeImageExists = false;
            });
        }
    }

    private nicknameTaken(): boolean {
        for(var individual of this.currentSiteIndividuals) {
            if(individual.individual_userstr === this.nickname) {
                return true;
            }
        }
        return false;
    }

    private nicknameHasInvalidCharacters(): boolean {
        let re = /^[A-Za-z0-9)(_'`\s.-]+$/;
        return !re.test(this.nickname);
    }

    private validateNickname() {
        if (this.nickname.length > 48) {
            this.nicknameError = "Nickname must be shorter than 48 characters."
        }
        else if (!this.nickname || this.nickname === '') {
            this.nicknameError = "Nickname must not be empty."
        }
        else if (this.nicknameTaken()) {
            this.nicknameError = "Nickname already taken at current site."
        }
        else if(this.nicknameHasInvalidCharacters()) {
            this.nicknameError = "Nickname contains invalid characters."
        }
        else {
            this.nicknameError = ""
        }
        this.cdr.detectChanges();
    }

    private updateNickname() {
        this.loadImages();
        if (this.selectedSpecies) {
            if (this.selectedSpecies.kingdom === 'Plantae') {
                this.nickname = `${this.selectedSpecies.common_name}-${this.selectedSpecies.numIndividualsAtSite + 1}`;
            }
            else if (this.selectedSpecies.kingdom === 'Animalia') {
                this.nickname = this.selectedSpecies.common_name;
            }
        }
        this.validateNickname();
    }

    public searchTextChanged() {
       this.cdr.markForCheck();
    }

    private sortSpecies() {
        this.species = this.species.sort((a, b) => {
            if (this.activeTab === 'common') {
                if(a.common_name.toLowerCase() > b.common_name.toLowerCase()) {
                    return 1;
                }
                else if(a.common_name.toLowerCase() < b.common_name.toLowerCase()) {
                    return -1;
                }
                else {
                    return 0;
                }
            }
            if (this.activeTab === 'scientific') {
                if(a.genus.toLowerCase().concat(a.species.toLowerCase()) > b.genus.toLowerCase().concat(b.species.toLowerCase())) {
                    return 1;
                }
                else if(a.genus.toLowerCase().concat(a.species.toLowerCase()) < b.genus.toLowerCase().concat(b.species.toLowerCase())) {
                    return -1;
                }
                else {
                    return 0;
                }
            }
            else {
                return 0;
            }
        });
    }

    public changePage(selectedTab) {
        this.activeTab = selectedTab;

        for (var sp of this.species) {
            // listview with objects: http://stackoverflow.com/questions/43566813/nativescript-use-listpicker-with-js-object
            let name = '';
            if (this.activeTab === 'common') {
                name = sp.common_name;
            }
            else {
                name = `${sp.genus} ${sp.species}`;
            }
            sp.toString = () => {
                return name.toLowerCase();
            }
        }

        this.sortSpecies();
    }

    public closeModal() {
        this.validateNickname();
        if(this.nicknameError === '') {
            let now = new Date();
            now.setHours(0,0,0,0);
            let individual = new Individual();
            individual.station_id = this.currentSite.station_id;
            individual.species_id = this.selectedSpecies.species_id;
            individual.individual_userstr = this.nickname;
            individual.active = 1;
            individual.seq_num = 0;
            if(this.currentSiteIndividuals.length > 0)
                individual.seq_num = Math.max(...this.currentSiteIndividuals.map(ind => ind.seq_num)) + 1;        
            individual.create_date = now.toISOString().split('T')[0];
            individual.deleted = 0;
            individual.site = this.currentSite;
            individual.selected = false;
            individual.species = this.selectedSpecies;
            // observations: Map<Date, Observation[]>;
            this.params.closeCallback(individual);
        } else {
            alert('Cannot add individual: ' + this.nicknameError);
        }

    }

    cancelModal() {
        this.params.closeCallback(null);
    }

    ngOnInit() {
        
    }

    ngAfterViewInit() {
        setTimeout(() => this._speciesService.getFromDatabase<Species>().then(species => {
            for (var sp of species) {
                sp.numIndividualsAtSite = 0;
                for (var individual of this.currentSiteIndividuals) {
                    if (sp.kingdom === 'Animalia' && individual.species.species_id === sp.species_id) {
                        sp.animalAlreadyAdded = true;
                    }
                    if (sp.kingdom === 'Plantae' && individual.species.species_id === sp.species_id) {
                        sp.numIndividualsAtSite += 1;
                    }
                }
            }
            for (var sp of species) {
                let name = sp.common_name;
                sp.toString = () => {
                    return name;
                }
            }
    
            this.species = species;
            this.sortSpecies();
            this.selectedSpecies = this.species[0];
    
            this.activeTab = 'common';
            this.updateNickname();
        }), 250);
    }
}