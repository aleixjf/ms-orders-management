import {ProductDescription} from "@domain/orders/value-objects/product-description.vo";
import {ProductId} from "@domain/orders/value-objects/product-id.vo";
import {ProductName} from "@domain/orders/value-objects/product-name.vo";
import {ProductQuantity} from "@domain/orders/value-objects/product-quantity.vo";

export class Product {
    private _id: ProductId;
    private _quantity: ProductQuantity;
    private _name?: ProductName;
    private _description?: ProductDescription;
    private _price?: number;

    constructor(
        id: ProductId,
        quantity: ProductQuantity,
        name?: ProductName,
        description?: ProductDescription,
        price?: number
    ) {
        this._id = id;
        this._quantity = quantity;
        this._name = name;
        this._description = description;
        this._price = price;
    }

    // Getters & Setters
    get id(): ProductId {
        return this._id;
    }

    get quantity(): ProductQuantity {
        return this._quantity;
    }

    get name(): ProductName | undefined {
        return this._name;
    }

    get description(): ProductDescription | undefined {
        return this._description;
    }

    get price(): number | undefined {
        return this._price;
    }

    get subtotal(): number {
        if (!this._price) return 0;
        return this._price * this._quantity.value;
    }

    // Factory Methods
    static create(
        id: ProductId,
        quantity: ProductQuantity,
        name?: ProductName,
        description?: ProductDescription,
        price?: number
    ): Product {
        return new Product(id, quantity, name, description, price);
    }
}
