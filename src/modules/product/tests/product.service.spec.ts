import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../product.service';
import { Product } from '../entities/product.entity';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 100,
  category: 'Electronics',
  ownerId: 'user123',
  description: 'product desc',
  stockQuantity: 10,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            save: jest.fn().mockResolvedValue(mockProduct),
            findOne: jest.fn().mockResolvedValue(mockProduct),
            createQueryBuilder: jest.fn().mockReturnValue({
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
            }),
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product', async () => {
    const result = await service.createProduct('user123', mockProduct);
    expect(result).toEqual(mockProduct);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should find one product', async () => {
    const result = await service.findOneProduct('1');
    expect(result.data).toEqual(mockProduct);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should throw an error if product not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    await expect(service.findOneProduct('2')).rejects.toThrow(NotFoundException);
  });

  it('should fetch all products', async () => {
    const query = { page: 0, limit: 10 };
    const result = await service.findAllProducts(query);
    expect(result.data.items).toEqual([mockProduct]);
    expect(result.data.total).toEqual(1);
  });

  it('should update a product', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);
    const updatedProduct = { name: 'Updated Product' };
    jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProduct, ...updatedProduct });

    const result = await service.updateProduct('1', updatedProduct);
    expect(result.name).toBe('Updated Product');
  });

  it('should delete a product', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct);
    const result = await service.deleteProduct('1');
    expect(result.message).toBe('Deletion in progress');
  });
});
