import {DefaultNamingStrategy, NamingStrategyInterface, Table} from "typeorm";

export class CustomNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
        const table =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name;

        const columns = columnNames.reduce(
            (name, column) => [name, column].join("_"),
            ""
        );

        return `PK_${table.toUpperCase()}::${columns.toUpperCase()}`;
    }

    foreignKeyName(
        tableOrName: Table | string,
        columnNames: string[],
        referencedTablePath?: string,
        referencedColumnNames?: string[]
    ): string {
        const table =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name;

        const columns = referencedColumnNames.reduce(
            (name, column) => [name, column].join("_"),
            ""
        );

        // ! We can't know the relation type here...
        // const relation: "M2M" | "M2O" | "O2O" = "M2M"; // ? O2M is not necessary since it is the same as M2O, and it will be defined in the M2O relation

        return `FK_${table.toUpperCase()}::${columns.toUpperCase()}`;
    }

    indexName(
        tableOrName: Table | string,
        columnNames: string[],
        where?: string
    ): string {
        const table =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name;

        const columns = columnNames.reduce(
            (name, column) => [name, column].join("_"),
            ""
        );

        return `IDX_${table.toUpperCase()}::${columns.toUpperCase()}`;
    }

    uniqueConstraintName(
        tableOrName: Table | string,
        columnNames: string[]
    ): string {
        const table =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name;

        const columns = columnNames.reduce(
            (name, column) => [name, column].join("_"),
            ""
        );

        return `UNQ_${table.toUpperCase()}::${columns.toUpperCase()}`;
    }
}
