import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsObject
} from 'class-validator';

class CpmOverridesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  video?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  display?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  social?: number;
}

export class CompareRequestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  totalBudget!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CpmOverridesDto)
  @IsObject()
  cpmOverrides?: CpmOverridesDto;
}
