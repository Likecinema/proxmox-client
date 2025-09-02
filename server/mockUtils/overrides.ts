import { ALLOW_FAKE_DATA, FAIL_FALLBACK, FORCE_FAKE_DATA } from "../constants";

export function failFallback(logMessage?: string, fakeData?: any):any {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor):any {
        const originalMethod = descriptor.value;
        if (!FAIL_FALLBACK && !FORCE_FAKE_DATA) return descriptor;
        descriptor.value = function(...args: any[]) {
            return new Promise(async (res, rej) => {
                originalMethod.apply(target, args).then((value:any) => {
                    if (FORCE_FAKE_DATA) {
                        res(fakeData);
                        return;
                    }
                    res(value)}
                ).catch((e: any) => {
                    if (logMessage) {
                        console.log(2222)
                        console.log(logMessage)
                    }
                    if (fakeData && ALLOW_FAKE_DATA) {
                        res(fakeData)
                        return;
                    }
                    else {
                        rej()
                    }
                })
            })
        }
        return descriptor;
    }
}
