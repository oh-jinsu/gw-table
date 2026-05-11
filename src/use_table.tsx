import { useLoaderData } from "react-router";

export type TableLoaderData<T extends (...args: any) => any> = Awaited<
  ReturnType<T>
>["table"];

export function useTable<
  T extends (...args: any) => any,
>(): TableLoaderData<T> {
  const { table } = useLoaderData();

  return table as TableLoaderData<T>;
}
