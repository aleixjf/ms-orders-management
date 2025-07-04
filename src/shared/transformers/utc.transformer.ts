import {ValueTransformer} from "typeorm";

// ? This transformer is used to convert dates into UTC dates storage in the database (timestamp types).
export const UTCTransformer: ValueTransformer = {
    // ? How the value is stored in the database
    to: (value: Date | string | null): Date | null => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        return new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
                date.getUTCMilliseconds()
            )
        );
    },

    // ? How the value is retrieved from the database
    from: (value: Date | string | null): Date | null => {
        if (!value) return null;
        return new Date(value);
    },
};
