import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import { parsePhotoArray, resolvePhotoRefs } from '../common/photos.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  findCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  findAll(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Produit ${id} introuvable`);
    return product;
  }

  /** Photos réelles du catalogue (back-office). Remplace la vignette illustrée par défaut. */
  async updatePhotos(id: string, photos: string[]) {
    const current = await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { photos: JSON.stringify(resolvePhotoRefs(parsePhotoArray(current.photos), 'products', id, photos)) },
      include: { category: true },
    });
  }
}
