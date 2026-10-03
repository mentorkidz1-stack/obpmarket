import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdatePhotosDto } from './dto/update-photos.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { parsePhotoArray, sendDataUri } from '../common/photos.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.products.createCategory(dto);
  }

  @Get('categories')
  findCategories() {
    return this.products.findCategories();
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.products.findAll(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  /** Image d'une photo du produit, mise en cache par le navigateur et le CDN. */
  @Get(':id/photo/:index')
  async photo(@Param('id') id: string, @Param('index') index: string, @Res() res: Response) {
    const product = await this.products.findOne(id);
    if (!sendDataUri(res, parsePhotoArray(product.photos)[Number(index)])) throw new NotFoundException('Photo introuvable.');
  }

  /** Back-office (catalogue). */
  @Patch(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  updatePhotos(@Param('id') id: string, @Body() dto: UpdatePhotosDto) {
    return this.products.updatePhotos(id, dto.photos);
  }
}
