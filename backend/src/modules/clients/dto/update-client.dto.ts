import { IsEnum, IsOptional, IsString, IsArray, Matches, IsNumber, Min } from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional()
  @IsString({ message: 'ФИО должно быть строкой' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Название компании должно быть строкой' })
  companyName?: string;

  @IsOptional()
  @Matches(/^\+?[\d\s\-()]{7,20}$/, { message: 'Некорректный формат телефона' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Название группы должно быть строкой' })
  groupName?: string;

  @IsOptional()
  @IsArray({ message: 'Услуги должны быть массивом' })
  @IsString({ each: true, message: 'Каждая услуга должна быть строкой' })
  services?: string[];

  @IsOptional()
  @IsString({ message: 'Заметки должны быть строкой' })
  notes?: string;

  @IsOptional()
  @IsEnum(ClientStatus, { message: 'Некорректный статус' })
  status?: ClientStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Сумма оплаты должна быть числом' })
  @Min(0, { message: 'Сумма оплаты не может быть отрицательной' })
  paymentAmount?: number;
}
