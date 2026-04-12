import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDimensionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  questionTemplate: string;
}
