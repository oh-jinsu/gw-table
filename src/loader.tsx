import type { LoaderFunctionArgs } from "react-router";
import { loadTable, type TableLoaderOptions } from "./load_table";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

export function tableLoader<T extends PgTableWithColumns<any>, TSelect>({
  repository,
  options,
}: TableLoaderOptions<T, TSelect>) {
  return async ({ request }: LoaderFunctionArgs) => {
    const table = await loadTable({
      request,
      repository,
      options,
    });

    return {
      table,
    };
  };
}
