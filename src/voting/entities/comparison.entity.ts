import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Bitvote } from '../../bitvote/entities/bitvote.entity';
import { Dimension } from '../../bitvote/entities/dimension.entity';
import { Item } from '../../bitvote/entities/item.entity';

export enum ComparisonResult {
  A_BETTER = 'A_BETTER',
  B_BETTER = 'B_BETTER',
}

@Entity('comparisons')
@Unique(['userId', 'dimensionId', 'itemAId', 'itemBId'])
export class Comparison {
  @PrimaryGeneratedColumn('uuid')
  comparisonId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  bitvoteId: string;

  @ManyToOne(() => Bitvote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bitvoteId' })
  bitvote: Bitvote;

  @Column()
  dimensionId: string;

  @ManyToOne(() => Dimension, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dimensionId' })
  dimension: Dimension;

  @Column()
  itemAId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemAId' })
  itemA: Item;

  @Column()
  itemBId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemBId' })
  itemB: Item;

  @Column({ type: 'enum', enum: ComparisonResult })
  result: ComparisonResult;

  @Column({ default: false })
  inferred: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
