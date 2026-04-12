import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBitvoteDto } from '../dtos/createBitvote.dto';
import { CreateDimensionDto } from '../dtos/createDimension.dto';
import { CreateItemDto } from '../dtos/createItem.dto';
import { UpdateBitvoteDto } from '../dtos/updateBitvote.dto';
import { UpdateDimensionDto } from '../dtos/updateDimension.dto';
import { UpdateItemDto } from '../dtos/updateItem.dto';
import { Bitvote } from '../entities/bitvote.entity';
import { Dimension } from '../entities/dimension.entity';
import { Item } from '../entities/item.entity';

@Injectable()
export class BitvoteService {
  constructor(
    @InjectRepository(Bitvote)
    private bitvoteRepo: Repository<Bitvote>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Dimension)
    private dimensionRepo: Repository<Dimension>,
  ) {}

  async create(userId: string, dto: CreateBitvoteDto): Promise<Bitvote> {
    const bitvote = this.bitvoteRepo.create({
      ownerId: userId,
      name: dto.name,
      description: dto.description,
    });
    return this.bitvoteRepo.save(bitvote);
  }

  async findAllByOwner(userId: string): Promise<Bitvote[]> {
    return this.bitvoteRepo.find({
      where: { ownerId: userId },
      relations: ['items', 'dimensions'],
    });
  }

  async findOne(id: string, userId: string): Promise<Bitvote> {
    const bitvote = await this.bitvoteRepo.findOne({
      where: { bitvoteId: id },
      relations: ['items', 'dimensions'],
    });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }
    return bitvote;
  }

  async update(id: string, userId: string, dto: UpdateBitvoteDto): Promise<Bitvote> {
    const bitvote = await this.findOneAsOwner(id, userId);
    Object.assign(bitvote, dto);
    return this.bitvoteRepo.save(bitvote);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOneAsOwner(id, userId);
    await this.bitvoteRepo.delete(id);
  }

  async addItem(bitvoteId: string, userId: string, dto: CreateItemDto): Promise<Item> {
    await this.findOneAsOwner(bitvoteId, userId);
    const item = this.itemRepo.create({
      bitvoteId,
      name: dto.name,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(bitvoteId: string, itemId: string, userId: string, dto: UpdateItemDto): Promise<Item> {
    await this.findOneAsOwner(bitvoteId, userId);
    const item = await this.itemRepo.findOne({ where: { itemId, bitvoteId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async removeItem(bitvoteId: string, itemId: string, userId: string): Promise<void> {
    await this.findOneAsOwner(bitvoteId, userId);
    const result = await this.itemRepo.delete({ itemId, bitvoteId });
    if (result.affected === 0) {
      throw new NotFoundException('Item not found');
    }
  }

  async addDimension(bitvoteId: string, userId: string, dto: CreateDimensionDto): Promise<Dimension> {
    await this.findOneAsOwner(bitvoteId, userId);
    const dimension = this.dimensionRepo.create({
      bitvoteId,
      name: dto.name,
      questionTemplate: dto.questionTemplate,
    });
    return this.dimensionRepo.save(dimension);
  }

  async updateDimension(bitvoteId: string, dimId: string, userId: string, dto: UpdateDimensionDto): Promise<Dimension> {
    await this.findOneAsOwner(bitvoteId, userId);
    const dim = await this.dimensionRepo.findOne({ where: { dimensionId: dimId, bitvoteId } });
    if (!dim) {
      throw new NotFoundException('Dimension not found');
    }
    Object.assign(dim, dto);
    return this.dimensionRepo.save(dim);
  }

  async removeDimension(bitvoteId: string, dimId: string, userId: string): Promise<void> {
    await this.findOneAsOwner(bitvoteId, userId);
    const result = await this.dimensionRepo.delete({ dimensionId: dimId, bitvoteId });
    if (result.affected === 0) {
      throw new NotFoundException('Dimension not found');
    }
  }

  private async findOneAsOwner(id: string, userId: string): Promise<Bitvote> {
    const bitvote = await this.bitvoteRepo.findOne({ where: { bitvoteId: id } });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }
    if (bitvote.ownerId !== userId) {
      throw new ForbiddenException('You do not own this BitVote');
    }
    return bitvote;
  }
}
