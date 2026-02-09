import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  Max,
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

class CustomMixDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  video!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  display!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  social!: number;
}

export class PlanRequestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  totalBudget!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsIn(['balanced', 'max_reach', 'max_engagement', 'custom'])
  strategy!: 'balanced' | 'max_reach' | 'max_engagement' | 'custom';

  @IsOptional()
  @ValidateNested()
  @Type(() => CpmOverridesDto)
  @IsObject()
  cpmOverrides?: CpmOverridesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomMixDto)
  @IsObject()
  customMix?: CustomMixDto;
}
