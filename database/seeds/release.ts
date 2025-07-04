import {DataSource} from "typeorm";
import {runSeeders, Seeder, SeederFactoryManager} from "typeorm-extension";

export default class ReleaseDataSeeder implements Seeder {
    track = true;

    public async run(
        source: DataSource,
        factory: SeederFactoryManager
    ): Promise<any> {
        console.log(`[${this.constructor.name}] Seeding update DB data...`);

        await runSeeders(source, {
            seeds: [],
        });
    }
}
