import {
  and,
  or,
  eq,
  ilike,
  type InferSelectModel,
  type SQLWrapper,
} from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import type { ColumnOf, TableRepository } from "./repository";

type TableOptions<T extends PgTableWithColumns<any>> = {
  where?: SQLWrapper;
  searchKey?: ColumnOf<T> | ColumnOf<T>[];
  defaultOrderBy: keyof InferSelectModel<T>;
  defaultDirection: "asc" | "desc";
  filters?: {
    [key in keyof InferSelectModel<T>]?: "auto";
  };
};

export type TableLoaderOptions<T extends PgTableWithColumns<any>, TSelect> = {
  repository: TableRepository<T, TSelect>;
  options: TableOptions<T>;
};

export async function loadTable<T extends PgTableWithColumns<any>, TSelect>({
  request,
  repository,
  options,
}: {
  request: Request;
  repository: TableRepository<T, TSelect>;
  options: TableOptions<T>;
}) {
  const searchParams = new URL(request.url).searchParams;

  const { where, searchKey, defaultOrderBy, defaultDirection } = options;

  const query = searchParams.get("query") ?? undefined;

  const limit = Number(searchParams.get("limit") ?? "10");

  const offset = Number(searchParams.get("offset") ?? "0");

  const orderBy = (searchParams.get("orderBy") ??
    defaultOrderBy) as keyof InferSelectModel<T>;

  const direction = (searchParams.get("direction") ?? defaultDirection) as
    | "asc"
    | "desc";

  const filterWhere = Object.entries(options.filters ?? {})
    .map(([key, value]) => {
      const param = searchParams.get(key);

      if (param) {
        return eq(
          repository.schema[key as keyof typeof repository.schema] as any,
          decodeURIComponent(param),
        );
      }

      return undefined;
    })
    .filter(Boolean) as SQLWrapper[];

  const whereClauses = and(
    ...filterWhere,
    where,
    searchKey && query
      ? Array.isArray(searchKey)
        ? or(
            ...searchKey.map((key) =>
              ilike(
                repository.schema[key as keyof typeof repository.schema] as any,
                `%${query}%`,
              ),
            ),
          )
        : ilike(
            repository.schema[
              searchKey as keyof typeof repository.schema
            ] as any,
            `%${query}%`,
          )
      : undefined,
  );

  const total = await repository.countTotal({ where: whereClauses });

  const items = await repository.findAll({
    orderBy: orderBy,
    direction: direction,
    limit,
    offset,
    where: whereClauses,
  });

  const filters = Object.fromEntries(
    await Promise.all(
      Object.keys(options.filters ?? {}).map(async (key) => {
        const values = await repository.select(key);

        return [key, values.filter(Boolean)] as [string, unknown[]];
      }),
    ),
  );

  return {
    items,
    total,
    limit,
    offset,
    orderBy,
    direction,
    searchKey,
    filters,
  };
}
