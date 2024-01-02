import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {ModalDialogParams} from "@nativescript/angular";
import { Page } from '@nativescript/core/ui/page';
const pageCommon = require('@nativescript/core/ui/page/page-common').Page;
import { Color } from '@nativescript/core/color';
import * as utils from '@nativescript/core/utils';
var applicationSettings = require("@nativescript/core/application-settings");

@Component({
    moduleId: module.id,
    selector: 'modal-content',
    templateUrl: './privacy-modal.html',
    styleUrls: ["../settings-common.scss"]
})
export class PrivacyModal {

    public observerPrivacyPolicy = `Privacy Act Statement
    
Authority: Relevant acts include the Organic Act, 43 U.S.C. 31 et seq., 1879; Fish and Wildlife Coordination Act, 1934; Fish and Wildlife Act, 1956; Migratory Bird Treaty Act, 1918; Migratory Bird Conservation Act, 1900; Federal Land Policy and Management Act, 1976; Fish and Wildlife Improvement Act, 1978; Endangered Species Act, 1973; Marine Mammal Protection Act, 1972; Great Lakes Fishery Act, 1956; Nonindigenous Aquatic Nuisance Prevention and Control Act, 1990; Water Resources Development Act, 1990; and other authorizations conveyed to the U.S. Geological Survey. 
    
Purpose: The USA-NPN uses names and email addresses to communicate with participants.
    
Routine Uses: The USA-NPN may communicate program updates, and contact participants in the event it is necessary to follow up on observations submitted.  If a participant is affiliated with a group, the group leader uses the name and email to communicate with the participant. Usernames and states are presented on the USA-NPN leaderboards. Personal information is not otherwise released to any other party.
    
Disclosure: Providing this information is voluntary. People may use many of the USA-NPN website tools and services without registration. To submit observations in Nature’s Notebook, participants must provide a username and email address.
    
The USA-NPN recognizes two types of observers: individual and group. A group observer is affiliated with a group, which has an administrator who has been given authorized access to the Site. In signing up with a group, a group observer has agreed to a policy of sharing his or her name, username, email, location, and observations with others in the group. A group observer has also agreed to allow the administrator of a group to download his or her name, username, email, location, and observations from a “group site interface.” In contrast to a group observer, an individual observer will not be identified by name, username, email or location, but only by a numeric identification (ID) in the Site. The numeric identification (ID) will be associated with any observations uploaded to the Site by an individual observer. 
    
With the exception of the identity and observation sharing policy within a group as described above, group observers and individual observers uploading data to the Site will be covered by the General Privacy Policy in this Terms of Use. Also, stringent safeguards will be in effect for group and individual observers who upload special observations subject to state and/or federal laws. Special observations requiring stringent safeguards include, but are not limited to, threatened or endangered species and invasive species. If you are submitting special observations potentially subject to (or requiring) stringent safeguards, please contact the USA-NPN National Coordinating Office (nco@usanpn.org) for the appropriate upload arrangements. `;

    constructor(private params: ModalDialogParams,
                page: Page) {
        page.backgroundColor = new Color(50, 0, 0, 0);
    }

    public closeModal() {
        this.params.closeCallback(false);
    }
}