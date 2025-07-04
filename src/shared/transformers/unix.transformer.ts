import {ValueTransformer} from "typeorm";

// ? This transformer is used to convert unix dates (in seconds) to date objects for storage in the database (timestamp types).
export const UnixTransformer: ValueTransformer = {
    // ? How the value is stored in the database
    to: (value?: number): Date | null =>
        typeof value === "number" ? new Date(value * 1000) : null,

    // ? How the value is retrieved from the database
    from: (value?: Date): number | null =>
        value instanceof Date ? Math.floor(value.getTime() / 1000) : null,
};
