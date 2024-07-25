import {ProductDTO} from "@modules/orders/dtos/product.dto";
import {Product} from "@modules/orders/entities/product.entity";

export class ProductMapper {
    dtoToEntity(dto: ProductDTO): Product {
        return new Product({
            id: dto.id,
            quantity: dto.quantity,
            name: dto.name,
            description: dto.description,
            price: dto.price,
        });
    }

    getEntity(order: Product | ProductDTO): Product {
        return order instanceof Product ? order : this.dtoToEntity(order);
    }

    entityToDTO(entity: Product): ProductDTO {
        return new ProductDTO({
            id: entity.id,
            quantity: entity.quantity,
            name: entity.name,
            description: entity.description,
            price: entity.price,
        });
    }

    getDTO(Product: Product | ProductDTO): ProductDTO {
        return Product instanceof ProductDTO
            ? Product
            : this.entityToDTO(Product);
    }
}
