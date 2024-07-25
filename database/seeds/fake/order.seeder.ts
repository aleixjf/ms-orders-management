import {DataSource} from "typeorm";
import {Seeder, SeederFactoryManager} from "typeorm-extension";

import {Order} from "@modules/orders/entities/order.entity";
import {Product} from "@modules/orders/entities/product.entity";

export default class OrderSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<void> {
        const orderFactory = factoryManager.get(Order);
        const productFactory = factoryManager.get(Product);

        const numOrders = Math.floor(Math.random() * 5) + 1; // Random number of orders between 1 and 5
        for (let i = 0; i < numOrders; i++) {
            const order = await orderFactory.make();
            const numProducts = Math.floor(Math.random() * 5) + 1; // Random number of products x order between 1 and 5
            const products = await productFactory.saveMany(numProducts);
            products.forEach((product) => {
                product.order = order;
            });
            order.products = products;
            await dataSource.getRepository(Order).save(order);
            await dataSource.getRepository(Product).save(products);
        }
    }
}
