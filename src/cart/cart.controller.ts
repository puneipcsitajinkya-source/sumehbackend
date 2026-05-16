import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { AddCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.userId);
  }

  @Post('add')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartDto) {
    return this.cartService.addItem(user.userId, dto.productId, dto.quantity);
  }

  @Patch('item/:productId')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.userId, productId, dto.quantity);
  }

  @Delete('remove/:productId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user.userId, productId);
  }
}
