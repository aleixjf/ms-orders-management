import {DataSource} from "typeorm";
import {runSeeders, Seeder, SeederFactoryManager} from "typeorm-extension";

export default class SetupDataSeeder implements Seeder {
    track = true; // ? This parameter allows this seeder to be executed only once

    public async run(
        source: DataSource,
        factory: SeederFactoryManager
    ): Promise<any> {
        console.log(`[${this.constructor.name}] Seeding initial DB data...`);

        await runSeeders(source, {
            seeds: [],
        });
    }
}
