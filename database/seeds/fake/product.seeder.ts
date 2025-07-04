import {DataSource} from "typeorm";
import {Seeder, SeederFactoryManager} from "typeorm-extension";

import {Product} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";

export default class ProductSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<void> {
        const productFactory = factoryManager.get(Product);
        await productFactory.saveMany(10);
    }
}
