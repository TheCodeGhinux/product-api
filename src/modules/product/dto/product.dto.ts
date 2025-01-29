import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(['price', 'name', 'stockQuantity'], {
    message: 'Sort must be one of price, name, or stockQuantity',
  })
  sort?: 'price' | 'name' | 'stockQuantity';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Order must be ASC or DESC' })
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class ProductResponseDto {
  @ApiProperty({
    example: 'b9f19b82-450d-4998-9684-3fb3864df632',
    description: 'Unique identifier of the product',
  })
  id: string;

  @ApiProperty({
    example: 'Wireless Mouse',
    description: 'Name of the product',
  })
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Price of the product',
  })
  price: number;

  @ApiProperty({
    example: 'A high-quality ergonomic wireless mouse',
    description: 'Description of the product',
  })
  description: string;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity of the product',
  })
  stockQuantity: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category of the product',
  })
  category: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-g1h2-34567890ijkl',
    description: 'Owner ID of the product',
    nullable: true,
  })
  ownerId: string | null;

  @ApiProperty({
    example: '2024-11-11T12:44:00.463Z',
    description: 'Timestamp when the product was deleted',
    nullable: true,
  })
  deletedAt?: string | null;
  @ApiProperty({
    example: '2024-11-11T12:44:00.463Z',
    description: 'Timestamp when the product was deleted',
    nullable: true,
  })
  created_at?: string | null;
  @ApiProperty({
    example: '2024-11-11T12:44:00.463Z',
    description: 'Timestamp when the product was deleted',
    nullable: true,
  })
  updated_at?: string | null;
}

export class BadRequestProductResponse {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'HTTP status message',
  })
  message: string;

  @ApiProperty({
    example: 'Validation failed (numeric string is expected)',
    description: 'Validation error message',
  })
  error: string;
}

export class NotFoundProductResponse {
  @ApiProperty({
    example: 404,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Not Found Error',
    description: 'HTTP status message',
  })
  message: string;

  @ApiProperty({
    example: 'Product not found',
    description: 'Error message',
  })
  error: string;
}

export class UnauthorizedProductResponse {
  @ApiProperty({
    example: 403,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Unauthorized Error',
    description: 'HTTP status message',
  })
  message: string;

  @ApiProperty({
    example: 'Unauthorized to update product',
    description: 'Error message',
  })
  error: string;
}
