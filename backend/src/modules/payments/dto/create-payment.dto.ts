import { IsInt, IsNotEmpty, IsBoolean, Matches, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Сумма обязательна' })
  @IsInt({ message: 'Сумма должна быть целым числом' })
  @Min(1, { message: 'Сумма должна быть больше 0' })
  amount: number;

  @IsNotEmpty({ message: 'Месяц обязателен' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Месяц должен быть в формате YYYY-MM',
  })
  month: string;

  @IsNotEmpty({ message: 'Тип платежа обязателен' })
  @IsBoolean({ message: 'isRenewal должен быть boolean' })
  isRenewal: boolean;
}
