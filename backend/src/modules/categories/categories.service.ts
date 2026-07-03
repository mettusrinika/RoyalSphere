import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll(activeOnly = true) {
    const query = activeOnly ? { isActive: true } : {};
    return this.categoryModel.find(query).sort({ sortOrder: 1, name: 1 });
  }

  async findBySlug(slug: string) {
    const cat = await this.categoryModel.findOne({ slug, isActive: true });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: any) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.categoryModel.findOne({ slug });
    if (existing) throw new ConflictException('Category with this name already exists');
    return this.categoryModel.create({ ...dto, slug });
  }

  async update(id: string, dto: any) {
    const cat = await this.categoryModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async delete(id: string) {
    await this.categoryModel.findByIdAndUpdate(id, { isActive: false });
    return { message: 'Category deactivated' };
  }

  async seedDefaults() {
    const defaults = [
      { name: 'Photography', slug: 'photography', icon: '📸', description: 'Professional photography services', sortOrder: 1 },
      { name: 'Decoration', slug: 'decoration', icon: '🎨', description: 'Event decoration and styling', sortOrder: 2 },
      { name: 'Catering', slug: 'catering', icon: '🍽️', description: 'Food and beverage services', sortOrder: 3 },
      { name: 'Makeup', slug: 'makeup', icon: '💄', description: 'Bridal and event makeup', sortOrder: 4 },
      { name: 'Entertainment', slug: 'entertainment', icon: '🎵', description: 'Music, DJ and entertainment', sortOrder: 5 },
      { name: 'Venues', slug: 'venues', icon: '🏛️', description: 'Event venues and spaces', sortOrder: 6 },
      { name: 'Lifestyle', slug: 'lifestyle', icon: '✨', description: 'Personal lifestyle services', sortOrder: 7 },
      { name: 'Mehendi', slug: 'mehendi', icon: '🌿', description: 'Mehendi/Henna artists', sortOrder: 8 },
    ];
    for (const cat of defaults) {
      await this.categoryModel.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
    }
    return { message: 'Default categories seeded' };
  }
}
