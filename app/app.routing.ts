import { ModuleWithProviders } from '@angular/core';
import {Routes} from '@angular/router';
import { NativeScriptRouterModule } from "@nativescript/angular";
import {AppComponent} from './app.component';
import {SitesComponent} from './pages/sites/sites.component';
import {NewSiteComponent} from './pages/sites/new-site/new-site.component';
import {ObserveComponent} from './pages/observe/observe.component';
import {SyncingComponent} from './pages/syncing/syncing.component';

const appRoutes: Routes = [
  // { path: '', component: AppComponent }, //don't need this angular goes here by default
  { path: 'accounts', loadChildren: () => import('~/pages/accounts/accounts.module').then(m => m.AccountsModule) },
  { path: 'calendar', loadChildren: () => import('~/pages/sync/calendar.module').then(m => m.CalendarModule) },
  { path: 'debug', loadChildren: () => import('~/pages/debug/debug.module').then(m => m.DebugModule) },
  { path: 'groups', loadChildren: () => import('~/pages/groups/groups.module').then(m => m.GroupsModule) },
  { path: 'individuals', loadChildren: () => import('~/pages/individuals/individuals.module').then(m => m.IndividualsModule) },
  { path: 'login', loadChildren: () => import('~/pages/login/login.module').then(m => m.LoginModule) },
  { path: 'newSite/:siteName', component: NewSiteComponent },
  { path: 'observe', component: ObserveComponent },
  { path: 'settings', loadChildren: () => import('~/pages/settings/settings.module').then(m => m.SettingsModule) },
  { path: 'sites', component: SitesComponent },
  { path: 'syncing', component: SyncingComponent },
  { path: 'welcome', loadChildren: () => import('~/pages/welcome/welcome.module').then(m => m.WelcomeModule) }
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders<NativeScriptRouterModule> = NativeScriptRouterModule.forRoot(appRoutes);