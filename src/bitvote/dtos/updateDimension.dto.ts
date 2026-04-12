import { IsOptional, IsString } from 'class-validator';

export class UpdateDimensionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  questionTemplate?: string;
}
