import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, ViewContainerRef} from '@angular/core';
import {ModalDialogParams, ModalDialogService} from "@nativescript/angular";
import { Page } from '@nativescript/core/ui/page';

@Component({
    moduleId: module.id,
    templateUrl: "./legend.html",
})
export class LegendModal implements OnInit {


    public completeIcon;
    public incompleteIcon; 

    constructor(
        private params: ModalDialogParams, 
        private page:Page) {
        this.completeIcon = params.context.completeIcon;
        this.incompleteIcon = params.context.incompleteIcon;
    }

    close() {
        this.params.closeCallback();
    }

    
    ngOnInit() {
        
    }
}