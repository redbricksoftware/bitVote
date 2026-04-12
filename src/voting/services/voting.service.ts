import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comparison, ComparisonResult } from '../entities/comparison.entity';
import { Bitvote } from '../../bitvote/entities/bitvote.entity';
import { Item } from '../../bitvote/entities/item.entity';
import { Dimension } from '../../bitvote/entities/dimension.entity';
import { RankingService } from './ranking.service';
import { AnswerDto } from '../dtos/answer.dto';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Comparison)
    private comparisonRepo: Repository<Comparison>,
    @InjectRepository(Bitvote)
    private bitvoteRepo: Repository<Bitvote>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Dimension)
    private dimensionRepo: Repository<Dimension>,
    private rankingService: RankingService,
  ) {}

  async getQuestion(
    userId: string,
    bitvoteId: string,
    dimensionId?: string,
  ): Promise<{
    dimensionId: string;
    dimensionName: string;
    questionText: string;
    itemA: { itemId: string; name: string };
    itemB: { itemId: string; name: string };
  } | null> {
    const bitvote = await this.bitvoteRepo.findOne({
      where: { bitvoteId },
      relations: ['items', 'dimensions'],
    });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }
    if (!bitvote.votingOpen) {
      throw new BadRequestException('Voting is not open');
    }
    if (bitvote.items.length < 2) {
      throw new BadRequestException('BitVote needs at least 2 items');
    }
    if (bitvote.dimensions.length === 0) {
      throw new BadRequestException('BitVote needs at least 1 dimension');
    }

    const dimensions = dimensionId
      ? bitvote.dimensions.filter((d) => d.dimensionId === dimensionId)
      : bitvote.dimensions;

    if (dimensions.length === 0) {
      throw new NotFoundException('Dimension not found');
    }

    const items = bitvote.items;

    for (const dim of dimensions) {
      const existing = await this.comparisonRepo.find({
        where: { userId, dimensionId: dim.dimensionId },
      });
      const pairSet = new Set<string>();
      for (const c of existing) {
        pairSet.add(`${c.itemAId}:${c.itemBId}`);
        pairSet.add(`${c.itemBId}:${c.itemAId}`);
      }

      const unanswered: [Item, Item][] = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const key = `${items[i].itemId}:${items[j].itemId}`;
          if (!pairSet.has(key)) {
            unanswered.push([items[i], items[j]]);
          }
        }
      }

      if (unanswered.length === 0) continue;

      const [itemA, itemB] =
        unanswered[Math.floor(Math.random() * unanswered.length)];
      const questionText = dim.questionTemplate
        .replace('{{a}}', itemA.name)
        .replace('{{b}}', itemB.name);

      return {
        dimensionId: dim.dimensionId,
        dimensionName: dim.name,
        questionText,
        itemA: { itemId: itemA.itemId, name: itemA.name },
        itemB: { itemId: itemB.itemId, name: itemB.name },
      };
    }

    return null;
  }

  async answer(
    userId: string,
    bitvoteId: string,
    dto: AnswerDto,
  ): Promise<void> {
    const bitvote = await this.bitvoteRepo.findOne({
      where: { bitvoteId },
      relations: ['items'],
    });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }
    if (!bitvote.votingOpen) {
      throw new BadRequestException('Voting is not open');
    }

    const itemIds = new Set(bitvote.items.map((i) => i.itemId));
    if (!itemIds.has(dto.itemAId) || !itemIds.has(dto.itemBId)) {
      throw new BadRequestException('Items do not belong to this BitVote');
    }
    if (dto.itemAId === dto.itemBId) {
      throw new BadRequestException('Cannot compare an item to itself');
    }

    const existing = await this.comparisonRepo.findOne({
      where: [
        {
          userId,
          dimensionId: dto.dimensionId,
          itemAId: dto.itemAId,
          itemBId: dto.itemBId,
        },
        {
          userId,
          dimensionId: dto.dimensionId,
          itemAId: dto.itemBId,
          itemBId: dto.itemAId,
        },
      ],
    });
    if (existing) {
      throw new BadRequestException('This comparison has already been answered');
    }

    const comparison = this.comparisonRepo.create({
      userId,
      bitvoteId,
      dimensionId: dto.dimensionId,
      itemAId: dto.itemAId,
      itemBId: dto.itemBId,
      result: dto.result,
      inferred: false,
    });
    await this.comparisonRepo.save(comparison);

    await this.rankingService.propagateInferences(
      userId,
      bitvoteId,
      dto.dimensionId,
    );

    const allItemIds = bitvote.items.map((i) => i.itemId);
    const totalPairs = (allItemIds.length * (allItemIds.length - 1)) / 2;
    const comparisonCount = await this.comparisonRepo.count({
      where: { userId, dimensionId: dto.dimensionId },
    });
    const isComplete = comparisonCount >= totalPairs;

    await this.rankingService.computeRankings(
      userId,
      bitvoteId,
      dto.dimensionId,
      allItemIds,
      isComplete,
    );
  }

  async getProgress(
    userId: string,
    bitvoteId: string,
  ): Promise<
    {
      dimensionId: string;
      dimensionName: string;
      answered: number;
      total: number;
      complete: boolean;
    }[]
  > {
    const bitvote = await this.bitvoteRepo.findOne({
      where: { bitvoteId },
      relations: ['items', 'dimensions'],
    });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }

    const totalPairs =
      (bitvote.items.length * (bitvote.items.length - 1)) / 2;
    const progress: {
      dimensionId: string;
      dimensionName: string;
      answered: number;
      total: number;
      complete: boolean;
    }[] = [];

    for (const dim of bitvote.dimensions) {
      const count = await this.comparisonRepo.count({
        where: { userId, dimensionId: dim.dimensionId },
      });
      progress.push({
        dimensionId: dim.dimensionId,
        dimensionName: dim.name,
        answered: count,
        total: totalPairs,
        complete: count >= totalPairs,
      });
    }

    return progress;
  }

  async getResults(bitvoteId: string) {
    const bitvote = await this.bitvoteRepo.findOne({
      where: { bitvoteId },
      relations: ['items', 'dimensions'],
    });
    if (!bitvote) {
      throw new NotFoundException('BitVote not found');
    }

    const aggregates =
      await this.rankingService.getAggregateResults(bitvoteId);

    const itemMap = new Map(bitvote.items.map((i) => [i.itemId, i.name]));
    const dimMap = new Map(bitvote.dimensions.map((d) => [d.dimensionId, d.name]));

    return aggregates.map((a) => ({
      dimensionId: a.dimensionId,
      dimensionName: dimMap.get(a.dimensionId) ?? a.dimensionId,
      itemId: a.itemId,
      itemName: itemMap.get(a.itemId) ?? a.itemId,
      meanRank: a.meanRank,
      deviation: a.deviation,
      totalUsers: a.totalUsers,
    }));
  }
}
