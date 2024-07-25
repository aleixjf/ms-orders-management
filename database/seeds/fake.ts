import {DataSource} from "typeorm";
import {runSeeders, Seeder, SeederFactoryManager} from "typeorm-extension";

import orderFactory from "@database/factories/order.factory";
import productFactory from "@database/factories/product.factory";
import OrderSeeder from "@database/seeds/fake/order.seeder";
import ProductSeeder from "@database/seeds/fake/product.seeder";

export default class FakeDataSeeder implements Seeder {
    public async run(
        source: DataSource,
        factory: SeederFactoryManager
    ): Promise<any> {
        console.log(`[${this.constructor.name}] Seeding fake data...`);

        await runSeeders(source, {
            seeds: [OrderSeeder, ProductSeeder],
            factories: [orderFactory, productFactory],
        });
    }
}
