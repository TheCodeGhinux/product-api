import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductQueryDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  async createProduct(userId: string, createProductDto: CreateProductDto) {
    const newProduct = new Product();
    Object.assign(newProduct, createProductDto);
    newProduct.ownerId = userId;
    return await this.productRepository.save(newProduct);
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
  }

  async findOneProduct(id: string): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        error: 'Not Found',
        message: 'Product not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }

    return { status: 'success', message: 'Product fetched sucessfully', data: product };
  }

  async findAllProducts(query: ProductQueryDto): Promise<any> {
    const qb = this.productRepository.createQueryBuilder('product');

    // Search by name
    if (query.q) {
      qb.andWhere('product.name ILIKE :search', { search: `%${query.q}%` });
    }

    // Filter by category
    if (query.category) {
      qb.andWhere('product.category = :category', { category: query.category });
    }

    // Filter by price range
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      qb.andWhere('product.price BETWEEN :min AND :max', {
        min: query.minPrice || 0,
        max: query.maxPrice || Number.MAX_VALUE,
      });
    }

    // Sorting
    if (query.sort) {
      qb.orderBy(`product.${query.sort}`, query.order || 'ASC');
    }

    // Pagination
    const page = query.page || 0;
    const limit = query.limit || 10;
    qb.skip(page * limit).take(limit);

    // Execute query
    const [items, total] = await qb.getManyAndCount();
    return { status: 'success', message: 'Products fetched successfully', data: { items, total, page, limit } };
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        error: 'Not Found',
        message: 'Product not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }

    // Update product using Object.assign
    Object.assign(product, updateProductDto);

    return this.productRepository.save(product);
  }

  // Delete a product by ID
  async deleteProduct(id: string): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        error: 'Not Found',
        message: 'Product not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }

    await this.productRepository.softDelete(id);

    return {
      status: 'success',
      message: 'Deletion in progress',
    };
  }
}
