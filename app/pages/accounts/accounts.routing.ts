import { NgModule, NO_ERRORS_SCHEMA} from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "@nativescript/angular";
import { AccountsComponent } from "./accounts.component";

export const routes: Routes = [
    {
        path: "",
        component: AccountsComponent
    }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],  // set the lazy loaded routes using forChild
    exports: [NativeScriptRouterModule],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AccountsRoutingModule { }