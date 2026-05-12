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

export type LoadTableFiltersOption<T extends PgTableWithColumns<any>> = {
  [key in keyof InferSelectModel<T>]?: "auto";
};

export type LoadTableOptions<T extends PgTableWithColumns<any>, TSelect> = {
  searchParams: URLSearchParams;
  repository: TableRepository<T, TSelect>;
  where?: SQLWrapper;
  searchKey?: ColumnOf<T> | ColumnOf<T>[];
  defaultLimit?: number;
  defaultOffset?: number;
  defaultOrderBy: keyof InferSelectModel<T>;
  defaultDirection: "asc" | "desc";
  filters?: LoadTableFiltersOption<T>;
};

export async function loadTable<T extends PgTableWithColumns<any>, TSelect>({
  searchParams,
  repository,
  ...options
}: LoadTableOptions<T, TSelect>) {
  const limit = Number(
    searchParams.get("limit") ?? options.defaultLimit ?? "10",
  );

  const offset = Number(
    searchParams.get("offset") ?? options.defaultOffset ?? "0",
  );

  const orderBy = (searchParams.get("orderBy") ??
    options.defaultOrderBy) as keyof InferSelectModel<T>;

  const direction = (searchParams.get("direction") ??
    options.defaultDirection) as "asc" | "desc";

  const whereClauses = collectWhereClauses(
    searchParams,
    repository,
    options.where,
    options.searchKey,
    options.filters,
  );

  const total = await repository.countTotal({ where: whereClauses });

  const items = await repository.findAll({
    orderBy: orderBy,
    direction: direction,
    limit,
    offset,
    where: whereClauses,
  });

  const filters = await collectFilters(options.filters, repository);

  return {
    items,
    total,
    limit,
    offset,
    orderBy,
    direction,
    searchKey: options.searchKey,
    filters,
  };
}

function collectWhereClauses<T extends PgTableWithColumns<any>>(
  searchParams: URLSearchParams,
  repository: TableRepository<T, any>,
  where: SQLWrapper | undefined,
  searchKey: ColumnOf<T> | ColumnOf<T>[] | undefined,
  filters: LoadTableFiltersOption<T> | undefined,
) {
  const query = searchParams.get("query") ?? undefined;

  const filterWhere = Object.entries(filters ?? {})
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

  return whereClauses;
}

async function collectFilters<T extends PgTableWithColumns<any>>(
  filters: LoadTableFiltersOption<T> | undefined,
  repository: TableRepository<T, any>,
) {
  return Object.fromEntries(
    await Promise.all(
      Object.keys(filters ?? {}).map(async (key) => {
        const values = await repository.select(key);

        return [key, values.filter(Boolean)] as [string, unknown[]];
      }),
    ),
  );
}
