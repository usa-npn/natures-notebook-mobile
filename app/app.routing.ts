import { ModuleWithProviders } from '@angular/core';
import {Routes} from '@angular/router';
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {AppComponent} from './app.component';
import {SitesComponent} from './pages/sites/sites.component';
import {NewSiteComponent} from './pages/sites/new-site/new-site.component';
import {ObserveComponent} from './pages/observe/observe.component';
import {SyncingComponent} from './pages/syncing/syncing.component';

const appRoutes: Routes = [
  // { path: '', component: AppComponent }, //don't need this angular goes here by default
  { path: 'accounts', loadChildren: "~/pages/accounts/accounts.module#AccountsModule" },
  { path: 'calendar', loadChildren: "~/pages/sync/calendar.module#CalendarModule" },
  { path: 'debug', loadChildren: "~/pages/debug/debug.module#DebugModule" },
  { path: 'groups', loadChildren: "~/pages/groups/groups.module#GroupsModule" },
  { path: 'individuals', loadChildren: "~/pages/individuals/individuals.module#IndividualsModule" },
  { path: 'login', loadChildren: "~/pages/login/login.module#LoginModule" },
  { path: 'newSite/:siteName', component: NewSiteComponent },
  { path: 'observe', component: ObserveComponent },
  { path: 'settings', loadChildren: "~/pages/settings/settings.module#SettingsModule" },
  { path: 'sites', component: SitesComponent },
  { path: 'syncing', component: SyncingComponent },
  { path: 'welcome', loadChildren: "~/pages/welcome/welcome.module#WelcomeModule" }
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = NativeScriptRouterModule.forRoot(appRoutes);