import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignClientDto {
  @IsUUID('4', { message: 'Некорректный ID специалиста' })
  @IsNotEmpty({ message: 'ID специалиста обязателен' })
  specialistId: string;
}
