import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdatePhotosDto } from './dto/update-photos.dto.js';
import { AdjustStockDto, UpdateCategoryDto, UpdateProductDto } from './dto/product-admin.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { parsePhotoArray, sendDataUri } from '../common/photos.js';

const CATALOG = [Role.GESTIONNAIRE_PRIX, Role.ADMIN];
const STOCK = [Role.GESTIONNAIRE_LIQUIDITE, Role.AGENT_MAGASIN, Role.ADMIN];

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ---- Public ----

  @Get('categories')
  findCategories() {
    return this.products.findCategories();
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

  // ---- Back-office : catalogue ----
  // Ces routes (création de produits et de catégories) étaient publiques avant l'audit de sécurité.

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  createCategory(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    return this.products.createCategory(dto, req);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  renameCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.products.renameCategory(id, dto, req);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.products.deleteCategory(id, req);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductDto) {
    return this.products.create(dto, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto, req);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STOCK)
  adjustStock(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.products.adjustStock(id, dto, req);
  }

  @Patch(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CATALOG)
  updatePhotos(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePhotosDto) {
    return this.products.updatePhotos(id, dto.photos, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.products.remove(id, req);
  }
}
