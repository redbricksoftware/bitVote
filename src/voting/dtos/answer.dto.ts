import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ComparisonResult } from '../entities/comparison.entity';

export class AnswerDto {
  @IsUUID()
  @IsNotEmpty()
  dimensionId: string;

  @IsUUID()
  @IsNotEmpty()
  itemAId: string;

  @IsUUID()
  @IsNotEmpty()
  itemBId: string;

  @IsEnum(ComparisonResult)
  result: ComparisonResult;
}
