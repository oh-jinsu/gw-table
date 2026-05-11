import {
  count,
  eq,
  desc,
  asc,
  type Table,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

export type FindAllOptions<T extends PgTableWithColumns<any>> = {
  orderBy?: keyof InferSelectModel<T>;
  direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
  where?: SQL<unknown>;
};

export type ColumnOf<T> =
  T extends PgTableWithColumns<infer TConfig>
    ? keyof TConfig["columns"]
    : never;

export type SelectModelOf<T> =
  T extends TableRepository<infer TSelect, any> ? TSelect : never;

export type InsertModelOf<T> =
  T extends TableRepository<any, infer TInsert> ? TInsert : never;

export interface TableRepository<
  T extends PgTableWithColumns<any>,
  TSelect = InferSelectModel<T>,
  TPrimaryKey extends keyof TSelect = "id" extends keyof TSelect ? "id" : never,
> {
  schema: T;
  find: (pk: TSelect[TPrimaryKey]) => Promise<TSelect | undefined>;
  countTotal: (options: { where?: SQL<unknown> }) => Promise<number>;
  findAll: (options: FindAllOptions<T>) => Promise<TSelect[]>;
  save: (values: InferInsertModel<T>) => Promise<TSelect>;
  update: (
    pk: TSelect[TPrimaryKey],
    values: Partial<InferInsertModel<T>>,
  ) => Promise<TSelect>;
  delete: (pk: TSelect[TPrimaryKey]) => Promise<void>;
  select(
    key: keyof InferSelectModel<T>,
  ): Promise<InferSelectModel<T>[typeof key][]>;
}

export type SchemaOf<
  TDatabase extends NodePgDatabase<any>,
  TSchemaKey extends keyof TDatabase["_"]["fullSchema"],
> = TDatabase["_"]["fullSchema"][TSchemaKey];

export class BaseTableRepository<
  TDatabase extends NodePgDatabase<any>,
  TSchemaKey extends keyof TDatabase["_"]["fullSchema"],
  TSelect = InferSelectModel<SchemaOf<TDatabase, TSchemaKey>>,
  TPrimaryKey extends keyof TSelect = "id" extends keyof TSelect ? "id" : never,
> implements TableRepository<
  SchemaOf<TDatabase, TSchemaKey>,
  TSelect,
  TPrimaryKey
> {
  db: TDatabase;
  schema: SchemaOf<TDatabase, TSchemaKey>;
  pk: TPrimaryKey;

  constructor(
    db: TDatabase,
    schema: TSchemaKey,
    pk: TPrimaryKey = "id" as TPrimaryKey,
  ) {
    this.db = db;
    this.schema = db._.fullSchema[schema];
    this.pk = pk;
  }

  async find(pk: TSelect[TPrimaryKey]): Promise<TSelect | undefined> {
    return await this.db
      .select()
      .from(this.schema)
      .where(eq(this.schema[this.pk], pk))
      .limit(1)
      .then((res: any) => res[0]);
  }

  async countTotal({ where }: { where?: SQL<unknown> }): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(this.schema)
      .where(where);
    return total;
  }

  async findAll(
    options: FindAllOptions<SchemaOf<TDatabase, TSchemaKey>>,
  ): Promise<TSelect[]> {
    const { orderBy, direction, limit, offset, where } = options;

    let builder = this.db.select().from(this.schema);

    if (where) {
      builder = builder.where(where) as any;
    }

    if (orderBy) {
      builder = builder.orderBy(
        direction === "desc"
          ? desc(this.schema[orderBy])
          : asc(this.schema[orderBy]),
      ) as any;
    }

    if (limit) {
      builder = builder.limit(limit) as any;
    }

    if (offset) {
      builder = builder.offset(offset) as any;
    }

    return (await builder) as TSelect[];
  }

  async save(
    values: InferInsertModel<SchemaOf<TDatabase, TSchemaKey>>,
  ): Promise<TSelect> {
    const [item] = await this.db
      .insert(this.schema as Table)
      .values(values)
      .onConflictDoUpdate({
        target: this.schema[this.pk],
        set: values,
      })
      .returning();
    return item as TSelect;
  }

  async delete(pk: TSelect[TPrimaryKey]): Promise<void> {
    await this.db
      .delete(this.schema as Table)
      .where(eq(this.schema[this.pk], pk));
  }

  async update(
    pk: TSelect[TPrimaryKey],
    values: Partial<InferInsertModel<SchemaOf<TDatabase, TSchemaKey>>>,
  ): Promise<TSelect> {
    const [item] = await this.db
      .update(this.schema as Table)
      .set(values)
      .where(eq(this.schema[this.pk], pk))
      .returning();

    return item as TSelect;
  }

  async select(
    key: keyof InferSelectModel<SchemaOf<TDatabase, TSchemaKey>>,
  ): Promise<InferSelectModel<SchemaOf<TDatabase, TSchemaKey>>[typeof key][]> {
    const rows = await this.db
      .select({ value: this.schema[key] as any })
      .from(this.schema)
      .groupBy(this.schema[key] as any);

    return rows.map((row) => row.value);
  }
}
