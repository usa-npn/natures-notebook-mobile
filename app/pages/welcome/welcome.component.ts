import { Component, OnInit } from '@angular/core';
import { icons } from '../icons';
import { Router } from '@angular/router';
import { NetworksService } from '../../shared/networks/networks.service';

@Component({
    moduleId: module.id,
    selector: "welcome",
    templateUrl: "./welcome.html"
})

export class WelcomeComponent implements OnInit {

    usersIcon = icons.usersIcon;
    userIcon = icons.userIcon;

    constructor(private _router: Router,
                private _networksService: NetworksService) { }

    goToSites() {
        this._router.navigate(["/sites"]);
    }

    goToGroups() {
        this._networksService.showJoinGroupModal = true;
        this._router.navigate(["/groups"]);
    }

    ngOnInit() { }
}