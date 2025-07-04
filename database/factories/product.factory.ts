import {faker} from "@faker-js/faker";
import {setSeederFactory} from "typeorm-extension";

import {Product} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";

export default setSeederFactory(
    Product,
    () =>
        new Product({
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.commerce.price({
                min: 0,
                max: 1000,
                dec: 2,
                symbol: "", // No currency symbol
            }),
            quantity: faker.number.int({min: 1, max: 100}),
        })
);
