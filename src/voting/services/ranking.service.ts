import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comparison, ComparisonResult } from '../entities/comparison.entity';
import { UserRanking } from '../entities/userRanking.entity';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Comparison)
    private comparisonRepo: Repository<Comparison>,
    @InjectRepository(UserRanking)
    private userRankingRepo: Repository<UserRanking>,
  ) {}

  async propagateInferences(
    userId: string,
    bitvoteId: string,
    dimensionId: string,
  ): Promise<void> {
    const comparisons = await this.comparisonRepo.find({
      where: { userId, dimensionId },
    });

    // Build adjacency: betterThan[x] = set of items x is better than
    const betterThan = new Map<string, Set<string>>();
    for (const c of comparisons) {
      if (c.result === ComparisonResult.A_BETTER) {
        if (!betterThan.has(c.itemAId)) betterThan.set(c.itemAId, new Set());
        betterThan.get(c.itemAId)!.add(c.itemBId);
      } else {
        if (!betterThan.has(c.itemBId)) betterThan.set(c.itemBId, new Set());
        betterThan.get(c.itemBId)!.add(c.itemAId);
      }
    }

    // Build existing pair set for quick lookup
    const existingPairs = new Set<string>();
    for (const c of comparisons) {
      existingPairs.add(`${c.itemAId}:${c.itemBId}`);
      existingPairs.add(`${c.itemBId}:${c.itemAId}`);
    }

    // Transitive closure: iterate until no new inferences
    let changed = true;
    const toInsert: { itemAId: string; itemBId: string }[] = [];

    while (changed) {
      changed = false;
      for (const [item, beaten] of betterThan) {
        const beatenArr = [...beaten];
        for (const loser of beatenArr) {
          const loserBeaten = betterThan.get(loser);
          if (!loserBeaten) continue;
          for (const transitive of loserBeaten) {
            if (transitive === item) continue;
            if (!beaten.has(transitive)) {
              beaten.add(transitive);
              const pairKey = `${item}:${transitive}`;
              if (!existingPairs.has(pairKey)) {
                existingPairs.add(pairKey);
                existingPairs.add(`${transitive}:${item}`);
                toInsert.push({ itemAId: item, itemBId: transitive });
              }
              changed = true;
            }
          }
        }
      }
    }

    if (toInsert.length > 0) {
      const entities = toInsert.map((pair) =>
        this.comparisonRepo.create({
          userId,
          bitvoteId,
          dimensionId,
          itemAId: pair.itemAId,
          itemBId: pair.itemBId,
          result: ComparisonResult.A_BETTER,
          inferred: true,
        }),
      );
      await this.comparisonRepo.save(entities);
    }
  }

  async computeRankings(
    userId: string,
    bitvoteId: string,
    dimensionId: string,
    itemIds: string[],
    isComplete: boolean,
  ): Promise<void> {
    const comparisons = await this.comparisonRepo.find({
      where: { userId, dimensionId },
    });

    const winCount = new Map<string, number>();
    for (const id of itemIds) {
      winCount.set(id, 0);
    }

    for (const c of comparisons) {
      if (c.result === ComparisonResult.A_BETTER) {
        winCount.set(c.itemAId, (winCount.get(c.itemAId) ?? 0) + 1);
      } else {
        winCount.set(c.itemBId, (winCount.get(c.itemBId) ?? 0) + 1);
      }
    }

    const sorted = [...winCount.entries()].sort((a, b) => b[1] - a[1]);

    for (let i = 0; i < sorted.length; i++) {
      const [itemId] = sorted[i];
      await this.userRankingRepo.upsert(
        {
          userId,
          bitvoteId,
          dimensionId,
          itemId,
          rank: i + 1,
          complete: isComplete,
        },
        ['userId', 'dimensionId', 'itemId'],
      );
    }
  }

  async getAggregateResults(bitvoteId: string): Promise<
    {
      dimensionId: string;
      itemId: string;
      meanRank: number;
      deviation: number;
      totalUsers: number;
    }[]
  > {
    const results = await this.userRankingRepo
      .createQueryBuilder('ur')
      .select('ur.dimensionId', 'dimensionId')
      .addSelect('ur.itemId', 'itemId')
      .addSelect('AVG(ur.rank)', 'meanRank')
      .addSelect('COALESCE(STDDEV(ur.rank), 0)', 'deviation')
      .addSelect('COUNT(DISTINCT ur.userId)', 'totalUsers')
      .where('ur.bitvoteId = :bitvoteId', { bitvoteId })
      .andWhere('ur.complete = true')
      .groupBy('ur.dimensionId')
      .addGroupBy('ur.itemId')
      .getRawMany();

    return results.map((r) => ({
      dimensionId: r.dimensionId,
      itemId: r.itemId,
      meanRank: parseFloat(r.meanRank),
      deviation: parseFloat(r.deviation),
      totalUsers: parseInt(r.totalUsers, 10),
    }));
  }
}
