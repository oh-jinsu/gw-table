import { useLocation, useNavigate, useSearchParams } from "react-router";
import { GoSearch } from "react-icons/go";
import { Table, type TableProps } from "./table";
import { useTable, type TableLoaderData } from "./use_table";
import { TablePageButtons } from "./buttons";

export type TablePageOptions<TModel> = {
  columns: TableProps<TModel>["columns"];
  primaryKey?: keyof TModel;
};

export type LoadedModel<T extends (...args: any) => any> =
  TableLoaderData<T>["items"][number];

export function TableForm<T extends (...args: any) => any>({
  columns,
  primaryKey = "id" as keyof LoadedModel<T>,
}: TablePageOptions<LoadedModel<T>>) {
  const { pathname } = useLocation();

  const {
    items,
    total,
    limit,
    offset,
    orderBy,
    direction,
    searchKey,
    filters,
  } = useTable<T>();

  const navigate = useNavigate();

  const search = (query: string) => {
    const searchParams = new URLSearchParams(window.location.search);

    searchParams.set("query", query);

    searchParams.set("offset", "0");

    navigate(`${pathname}?${searchParams.toString()}`);
  };

  const [searchParams] = useSearchParams();

  return (
    <>
      {searchKey && (
        <form
          className="h-20 px-4 flex items-center border-t"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const query = formData.get("query") as string;
            search(query);
          }}
        >
          <button
            type="submit"
            className="w-10 h-10 flex justify-center items-center"
          >
            <GoSearch className="text-xl mr-4" />
          </button>
          <input
            className="outline-none h-full flex-1"
            placeholder="여기에 검색하세요..."
            name="query"
            defaultValue={searchParams.get("query") ?? ""}
          />
        </form>
      )}
      <Table
        data={items}
        columns={columns}
        getLink={
          primaryKey ? (item) => `${pathname}/${item[primaryKey]}` : undefined
        }
        orderBy={orderBy}
        direction={direction}
        filters={filters}
      />
      <TablePageButtons
        total={total}
        limit={limit}
        offset={offset}
        MAX_PAGES_TO_SHOW={10}
      />
    </>
  );
}
