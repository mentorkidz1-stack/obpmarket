import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdatePhotosDto } from './dto/update-photos.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

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

  /** Back-office (catalogue). */
  @Patch(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  updatePhotos(@Param('id') id: string, @Body() dto: UpdatePhotosDto) {
    return this.products.updatePhotos(id, dto.photos);
  }
}
