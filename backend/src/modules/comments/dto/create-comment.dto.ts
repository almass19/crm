import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Комментарий должен быть строкой' })
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  content: string;
}
