import {faker} from "@faker-js/faker";
import {setSeederFactory} from "typeorm-extension";

import {OrderStatus} from "@enums/order-status.enum";

import {Order} from "@modules/orders/entities/order.entity";

export default setSeederFactory(Order, () => {
    return new Order({
        id: faker.string.uuid(),
        customer_id: faker.string.uuid(),
        order_date: faker.date.recent().getTime(),
        delivery_date: faker.date.soon().getTime(),
        status: faker.helpers.arrayElement([
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
        ]),
        products: [], // ? This will be populated by the seeder, not by the factory
    });
});
