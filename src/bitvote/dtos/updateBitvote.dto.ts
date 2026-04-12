import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateBitvoteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  votingOpen?: boolean;
}
