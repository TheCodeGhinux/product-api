import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BadRequestProductResponse,
  NotFoundProductResponse,
  ProductResponseDto,
  UnauthorizedProductResponse,
} from '../dto/product.dto';

export function CreateProductDocs() {
  return applyDecorators(
    ApiTags('Product'),
    ApiOperation({ summary: 'Create a new product' }),
    ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto }),
    ApiResponse({
      status: 400,
      description: 'Invalid input or product already exists',
      type: BadRequestProductResponse,
    })
  );
}

export function FindAllProductsDocs() {
  return applyDecorators(
    ApiTags('Product'),
    ApiOperation({ summary: 'Get all products' }),
    ApiResponse({ status: 200, description: 'Retrieve all products', type: [ProductResponseDto] }),
    ApiResponse({ status: 400, description: 'Invalid query parameters', type: BadRequestProductResponse })
  );
}

export function FindOneProductDocs() {
  return applyDecorators(
    ApiTags('Product'),
    ApiOperation({ summary: 'Get a product by ID' }),
    ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto }),
    ApiResponse({ status: 404, description: 'Product not found', type: NotFoundProductResponse })
  );
}

export function UpdateProductDocs() {
  return applyDecorators(
    ApiTags('Product'),
    ApiOperation({ summary: 'Update a product' }),
    ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductResponseDto }),
    ApiResponse({ status: 403, description: 'Unauthorized to update product', type: UnauthorizedProductResponse }),
    ApiResponse({ status: 404, description: 'Product not found', type: NotFoundProductResponse })
  );
}

export function DeleteProductDocs() {
  return applyDecorators(
    ApiTags('Product'),
    ApiOperation({ summary: 'Delete a product' }),
    ApiResponse({ status: 200, description: 'Product deleted successfully' }),
    ApiResponse({ status: 403, description: 'Unauthorized to delete product', type: UnauthorizedProductResponse }),
    ApiResponse({ status: 404, description: 'Product not found', type: NotFoundProductResponse })
  );
}
