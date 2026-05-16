import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class GuestOrderAddressDto {
  @IsString()
  @MinLength(3)
  line1: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(4)
  pincode: string;
}

export class GuestOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateGuestOrderDto {
  @IsString()
  @MinLength(10)
  customerPhone: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  customerName?: string;

  @ValidateNested()
  @Type(() => GuestOrderAddressDto)
  address: GuestOrderAddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items: GuestOrderItemDto[];
}
