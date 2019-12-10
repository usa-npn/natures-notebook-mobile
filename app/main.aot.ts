import { platformNativeScript } from "nativescript-angular/platform-static";
import { AppModuleNgFactory } from "./app.module.ngfactory";

platformNativeScript({startPageActionBarHidden: true}).bootstrapModuleFactory(AppModuleNgFactory);