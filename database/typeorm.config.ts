import {ConfigModule} from "@nestjs/config";

import {DataSource, type DataSourceOptions} from "typeorm";
import {SeederOptions} from "typeorm-extension";

import configuration from "@config/configuration";
import {validate} from "@config/validation";

import {CustomNamingStrategy} from "@database/naming.strategy";

ConfigModule.forRoot({
    expandVariables: true,
    envFilePath: process.env.NODE_ENV
        ? [
              `src/config/environments/.env.${process.env.NODE_ENV}`,
              `.env.${process.env.NODE_ENV}`,
              ".env",
          ]
        : [
              "src/config/environments/.env.development",
              ".env.development",
              ".env",
          ],
    load: [configuration],
    validate,
});

const options: Partial<DataSourceOptions> & SeederOptions = {
    // @ts-expect-error - Type 'string' is not assignable to type 'DatabaseType'
    type: process.env.RDB_TYPE,
    host: process.env.RDB_HOST,
    port: parseInt(process.env.RDB_PORT, 10) || 5432,
    database: process.env.RDB_NAME,
    username: process.env.RDB_USER,
    password: process.env.RDB_PASSWORD,
    entities: [`${__dirname}/../**/*.entity.{ts,js}`],
    migrations: [`${__dirname}/**/migrations/*.{ts,js}`],
    seeds: [`${__dirname}/**/seeds/*.{ts,js}`],
    namingStrategy: new CustomNamingStrategy(),
};
export default new DataSource(options as DataSourceOptions & SeederOptions);
