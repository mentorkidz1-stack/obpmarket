import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService, type AuditActor } from '../audit/audit.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { AdjustStockDto, UpdateCategoryDto, UpdateProductDto } from './dto/product-admin.dto.js';
import { parsePhotoArray, resolvePhotoRefs } from '../common/photos.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- Catégories ----

  async createCategory(dto: CreateCategoryDto, actor?: AuditActor) {
    const category = await this.prisma.category.create({ data: { name: dto.name.trim() } });
    await this.audit.log(actor ?? null, 'Catégorie créée', `Catégorie ${category.name}`);
    return category;
  }

  findCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  }

  async renameCategory(id: string, dto: UpdateCategoryDto, actor: AuditActor) {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Catégorie introuvable.');
    const category = await this.prisma.category.update({ where: { id }, data: { name: dto.name.trim() } });
    await this.audit.log(actor, 'Catégorie renommée', `Catégorie ${before.name}`, `→ ${category.name}`);
    return category;
  }

  async deleteCategory(id: string, actor: AuditActor) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    if (category._count.products > 0) {
      throw new ConflictException(`Cette catégorie contient ${category._count.products} produit(s) : déplacez-les ou supprimez-les d'abord.`);
    }
    await this.prisma.category.delete({ where: { id } });
    await this.audit.log(actor, 'Catégorie supprimée', `Catégorie ${category.name}`);
    return { deleted: true };
  }

  // ---- Produits ----

  async create(dto: CreateProductDto, actor?: AuditActor) {
    const product = await this.prisma.product.create({ data: { ...dto, name: dto.name.trim(), unitLabel: dto.unitLabel.trim() } });
    await this.audit.log(actor ?? null, 'Produit créé', `Produit ${product.name} (${product.unitLabel})`);
    return product;
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

  async update(id: string, dto: UpdateProductDto, actor: AuditActor) {
    const before = await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { ...dto, name: dto.name?.trim(), unitLabel: dto.unitLabel?.trim() },
      include: { category: true },
    });
    await this.audit.log(actor, 'Produit modifié', `Produit ${before.name}`, Object.keys(dto).join(', '));
    return product;
  }

  /** Nouveau total en magasin, avec le motif (réception de marchandise, casse, inventaire…). */
  async adjustStock(id: string, dto: AdjustStockDto, actor: AuditActor) {
    const before = await this.findOne(id);
    const product = await this.prisma.product.update({ where: { id }, data: { stockQuantity: dto.quantity }, include: { category: true } });
    await this.audit.log(actor, 'Stock modifié', `Produit ${before.name}`, `${before.stockQuantity} → ${dto.quantity} · ${dto.reason}`);
    return product;
  }

  /** Suppression refusée dès que le produit a une histoire (commandes, relevés, stock client) : on le retire du catalogue autrement. */
  async remove(id: string, actor: AuditActor) {
    const product = await this.findOne(id);
    const [orders, readings, holdings] = await Promise.all([
      this.prisma.orderItem.count({ where: { productId: id } }),
      this.prisma.priceReading.count({ where: { productId: id } }),
      this.prisma.stockHolding.count({ where: { productId: id } }),
    ]);
    if (orders + readings + holdings > 0) {
      throw new ConflictException(
        `« ${product.name} » a déjà ${orders} commande(s), ${readings} relevé(s) de prix et ${holdings} stock(s) client : il ne peut plus être supprimé. Mettez son stock à 0 pour le retirer de la vente.`,
      );
    }
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log(actor, 'Produit supprimé', `Produit ${product.name}`);
    return { deleted: true };
  }

  /** Photos réelles du catalogue (back-office). Remplace la vignette illustrée par défaut. */
  async updatePhotos(id: string, photos: string[], actor?: AuditActor) {
    const current = await this.findOne(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { photos: JSON.stringify(resolvePhotoRefs(parsePhotoArray(current.photos), 'products', id, photos)) },
      include: { category: true },
    });
    await this.audit.log(actor ?? null, 'Photos du produit modifiées', `Produit ${current.name}`, `${photos.length} photo(s)`);
    return updated;
  }
}
