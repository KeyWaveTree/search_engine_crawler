// 키워드와 링크의 연결고리 테이블
import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Keyword } from "./Keyword";
import { Link } from "./Link";

@Table
export class KeywordLink extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: bigint;

  @ForeignKey(() => Keyword)
  @Column
  keywordId: bigint;

  @ForeignKey(() => Link)
  @Column
  linkId: bigint;
}
