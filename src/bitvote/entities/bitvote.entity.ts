import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Dimension } from "./dimension.entity";
import { Item } from "./item.entity";

@Entity("bitvotes")
export class Bitvote {
  @PrimaryGeneratedColumn("uuid")
  bitvoteId: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  votingOpen: boolean;

  @OneToMany(() => Item, (item) => item.bitvote, { cascade: true })
  items: Item[];

  @OneToMany(() => Dimension, (dim) => dim.bitvote, { cascade: true })
  dimensions: Dimension[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
