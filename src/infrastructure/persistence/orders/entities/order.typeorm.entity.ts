import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import {UTCTransformer} from "@transformers/utc.transformer";

import {OrderStatus} from "@enums/order-status.enum";

import {Product} from "./product.typeorm.entity";

@Entity({name: "orders"})
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn("uuid", {
        primaryKeyConstraintName: "PK_ORDERS::ID",
    })
    id: string;

    @Column({type: "uuid"})
    @Index("IDX_ORDERS::CUSTOMERS", {})
    customer_id: string;

    @Column({
        type: "timestamptz",
        transformer: UTCTransformer,
    })
    order_date: number;

    @Column({
        type: "timestamptz",
        transformer: UTCTransformer,
    })
    delivery_date: number;

    @CreateDateColumn()
    created_date: Date;

    @UpdateDateColumn()
    updated_date: Date;

    @OneToMany(() => Product, (product) => product.order, {
        cascade: true,
        eager: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    })
    products: Product[];

    @Column({type: "enum", enum: OrderStatus, default: OrderStatus.PENDING})
    @Index("IDX_ORDERS::STATUS", {})
    status: OrderStatus;

    constructor(partial: Partial<Order>) {
        super();
        Object.assign(this, partial);
    }
}
