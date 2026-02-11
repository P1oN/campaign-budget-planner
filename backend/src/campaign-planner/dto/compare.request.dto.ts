import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsObject,
  Max,
  MaxLength
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

class CustomStrategyDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @ValidateNested()
  @Type(() => CustomMixDto)
  @IsObject()
  mix!: CustomMixDto;
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CustomStrategyDto)
  customStrategies?: CustomStrategyDto[];
}
