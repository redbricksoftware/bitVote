import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Bitvote } from "./bitvote.entity";

@Entity("dimensions")
export class Dimension {
  @PrimaryGeneratedColumn("uuid")
  dimensionId: string;

  @Column()
  bitvoteId: string;

  @ManyToOne(() => Bitvote, (bv) => bv.dimensions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bitvoteId" })
  bitvote: Bitvote;

  @Column()
  name: string;

  @Column()
  questionTemplate: string;
}
