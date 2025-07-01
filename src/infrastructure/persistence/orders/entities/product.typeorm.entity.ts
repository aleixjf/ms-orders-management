import {
    BaseEntity,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

import {Order} from "@infrastructure/persistence/orders/entities/order.typeorm.entity";

@Entity({name: "products"})
export class Product extends BaseEntity {
    @PrimaryColumn({
        type: "uuid",
        unique: false,
        primaryKeyConstraintName: "PK_PRODUCTS::ID",
    })
    @Index("IDX_PRODUCTS::ID", {})
    id: string;

    @Column()
    quantity: number;

    @Column({nullable: true})
    name?: string;

    @Column({nullable: true})
    description?: string;

    @Column({nullable: true})
    price?: string;

    @ManyToOne(() => Order, (order) => order.products)
    @JoinColumn({
        name: "order_id",
        foreignKeyConstraintName: "FK_PRODUCTS::M2O_ORDER",
    })
    @Index("IDX_PRODUCTS::ORDER", {})
    order: Order;

    constructor(partial: Partial<Product>) {
        super();
        Object.assign(this, partial);
    }
}
