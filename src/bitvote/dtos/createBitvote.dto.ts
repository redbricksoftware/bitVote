import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBitvoteDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
