import { CanActivate, ExecutionContext, Injectable, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CustomHttpException } from '../helpers/custom-http-filter';
import * as SYS_MSG from '../constant/SystemMessages';
import { ProductService } from '@/modules/product/product.service';

@Injectable()
export class ProductOwnerGuard implements CanActivate {
  constructor(
    private readonly productService: ProductService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request['user'] as any;
    const productId = request.params['id'];

    // If no user is set, deny cess
    if (!user) {
      throw new CustomHttpException(SYS_MSG.UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
    }

    // Fetch the product details
    const product = await this.productService.findOne(productId);

    if (!product) {
      throw new CustomHttpException(SYS_MSG.RESOURCE_NOT_FOUND('Product'), HttpStatus.NOT_FOUND);
    }

    // Check if the user is an admin or the product owner
    if (user.role === 'admin' || user.id === product.ownerId) {
      return true;
    }

    // If not authorized, throw an exception
    throw new CustomHttpException(SYS_MSG.UNAUTHORIZED_MESSAGE, HttpStatus.FORBIDDEN);
  }
}
