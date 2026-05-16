import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(3)
  line1: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(4)
  pincode: string;

  @IsString()
  @MinLength(8)
  phone: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  line1?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  pincode?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;
}
