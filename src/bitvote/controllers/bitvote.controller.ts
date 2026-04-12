import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserDecorator } from '../../auth/decorators/user.decorator';
import { AccessTokenGuard } from '../../auth/guards/accessToken.guard';
import { CreateBitvoteDto } from '../dtos/createBitvote.dto';
import { CreateDimensionDto } from '../dtos/createDimension.dto';
import { CreateItemDto } from '../dtos/createItem.dto';
import { UpdateBitvoteDto } from '../dtos/updateBitvote.dto';
import { UpdateDimensionDto } from '../dtos/updateDimension.dto';
import { UpdateItemDto } from '../dtos/updateItem.dto';
import { BitvoteService } from '../services/bitvote.service';

@ApiTags('BitVotes')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('bitvotes')
export class BitvoteController {
  constructor(private bitvoteService: BitvoteService) {}

  @Version('1')
  @Post()
  create(@UserDecorator() user: any, @Body() dto: CreateBitvoteDto) {
    return this.bitvoteService.create(user.sub, dto);
  }

  @Version('1')
  @Get()
  findAll(@UserDecorator() user: any) {
    return this.bitvoteService.findAllByOwner(user.sub);
  }

  @Version('1')
  @Get(':id')
  findOne(@UserDecorator() user: any, @Param('id') id: string) {
    return this.bitvoteService.findOne(id, user.sub);
  }

  @Version('1')
  @Patch(':id')
  update(@UserDecorator() user: any, @Param('id') id: string, @Body() dto: UpdateBitvoteDto) {
    return this.bitvoteService.update(id, user.sub, dto);
  }

  @Version('1')
  @Delete(':id')
  remove(@UserDecorator() user: any, @Param('id') id: string) {
    return this.bitvoteService.remove(id, user.sub);
  }

  @Version('1')
  @Post(':id/items')
  addItem(@UserDecorator() user: any, @Param('id') id: string, @Body() dto: CreateItemDto) {
    return this.bitvoteService.addItem(id, user.sub, dto);
  }

  @Version('1')
  @Patch(':id/items/:itemId')
  updateItem(@UserDecorator() user: any, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateItemDto) {
    return this.bitvoteService.updateItem(id, itemId, user.sub, dto);
  }

  @Version('1')
  @Delete(':id/items/:itemId')
  removeItem(@UserDecorator() user: any, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.bitvoteService.removeItem(id, itemId, user.sub);
  }

  @Version('1')
  @Post(':id/dimensions')
  addDimension(@UserDecorator() user: any, @Param('id') id: string, @Body() dto: CreateDimensionDto) {
    return this.bitvoteService.addDimension(id, user.sub, dto);
  }

  @Version('1')
  @Patch(':id/dimensions/:dimId')
  updateDimension(@UserDecorator() user: any, @Param('id') id: string, @Param('dimId') dimId: string, @Body() dto: UpdateDimensionDto) {
    return this.bitvoteService.updateDimension(id, dimId, user.sub, dto);
  }

  @Version('1')
  @Delete(':id/dimensions/:dimId')
  removeDimension(@UserDecorator() user: any, @Param('id') id: string, @Param('dimId') dimId: string) {
    return this.bitvoteService.removeDimension(id, dimId, user.sub);
  }
}
