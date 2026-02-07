import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  @IsInt({ message: 'Год должен быть числом' })
  @Min(2020, { message: 'Год должен быть не менее 2020' })
  @Max(2100, { message: 'Год должен быть не более 2100' })
  @Type(() => Number)
  year: number;

  @IsInt({ message: 'Месяц должен быть числом' })
  @Min(1, { message: 'Месяц должен быть от 1 до 12' })
  @Max(12, { message: 'Месяц должен быть от 1 до 12' })
  @Type(() => Number)
  month: number;
}

export class AdminDashboardQueryDto extends DashboardQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
