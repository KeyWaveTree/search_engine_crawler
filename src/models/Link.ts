// URL과 거기에 있는 대표 문자열들 추출하여 저장
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Keyword } from "./Keyword";
import { KeywordLink } from "./KeywordLink";

@Table
export class Link extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: bigint;

  @Column(DataType.STRING(2048))
  url: string;

  @Column(DataType.STRING(512))
  description: string;

  @BelongsToMany(() => Keyword, () => KeywordLink)
  Keywords: Keyword[];
}
