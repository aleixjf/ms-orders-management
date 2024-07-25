import {inspect, InspectOptions} from "util";

export function stringify(v: any, options?: Partial<InspectOptions>): string {
    try {
        switch (typeof v) {
            case "object":
                return (
                    inspect(v, {
                        ...options,
                        depth: options?.depth || 3,
                        getters: options?.getters || false,
                        showHidden:
                            options?.showHidden || Object.keys(v).length === 0,
                    }) || JSON.stringify(v, null, 2)
                );
            default:
                return v.toString() || `${v}`;
        }
    } catch (e) {
        return v;
    }
}
