// Older NativeScript plugins (e.g. nativescript-google-maps-sdk) were compiled expecting
// `NativeClass` to be a real runtime-global decorator function. The current toolchain only
// strips/downlevels the `@NativeClass` decorator from this app's own TypeScript source at
// compile time and no longer registers a runtime global, so pre-compiled plugin JS that still
// calls `NativeClass()` directly crashes with "NativeClass is not defined". Polyfill it as a
// no-op decorator; native class registration for classes extending NSObject/UIResponder etc.
// happens automatically regardless of this decorator in the current runtime.
if (typeof (globalThis as any).NativeClass === 'undefined') {
    (globalThis as any).NativeClass = function () {
        return function (target: any) {
            return target;
        };
    };
}
