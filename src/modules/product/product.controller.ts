import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductOwnerGuard } from '@/guards/product-owner.guard';
import {
  CreateProductDocs,
  DeleteProductDocs,
  FindAllProductsDocs,
  FindOneProductDocs,
  UpdateProductDocs,
} from './docs/product.doc';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @CreateProductDocs()
  @Post()
  createProduct(@Req() request: Request, @Body() createProductDto: CreateProductDto) {
    const userId = request['user'].id;
    return this.productService.createProduct(userId, createProductDto);
  }

  @FindAllProductsDocs()
  @Get()
  findAllProduct(@Req() request: Request, @Param() query: any) {
    const userId = request['user'].id;
    return this.productService.findAllProducts(query);
  }

  @FindOneProductDocs()
  @Get(':id')
  findOneProduct(@Req() request: Request, @Param('id') id: string) {
    const userId = request['user'].id;
    return this.productService.findOneProduct(id);
  }

  @UpdateProductDocs()
  @UseGuards(ProductOwnerGuard)
  @Patch(':id')
  updateProduct(@Req() request: Request, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const userId = request['user'].id;
    return this.productService.updateProduct(id, updateProductDto);
  }

  @DeleteProductDocs()
  @UseGuards(ProductOwnerGuard)
  @Delete(':id')
  deleteProduct(@Req() request: Request, @Param('id') id: string) {
    const userId = request['user'].id;
    return this.productService.deleteProduct(id);
  }
}
