import { cn } from "./cn";
import type {
  DetailedHTMLProps,
  FC,
  ReactNode,
  TableHTMLAttributes,
} from "react";
import { GoArrowDown, GoArrowUp } from "react-icons/go";
import { Link, useSearchParams } from "react-router";

export type TableColumnProps<TModel, TKey extends keyof TModel> =
  | ReactNode
  | {
      label: ReactNode;
      mapper?: (value: TModel[TKey], item: TModel) => ReactNode;
      sort?: (a: TModel, b: TModel) => number;
    };

export type TableColumnOptions<TModel> = {
  [K in keyof TModel]?: TableColumnProps<TModel, K>;
};

export type OrderedTableProps<TModel> = DetailedHTMLProps<
  TableHTMLAttributes<HTMLTableElement>,
  HTMLTableElement
> & {
  data: TModel[];
  columns: TableColumnOptions<TModel>;
  mapper?: FC<{ item: TModel; index: number; children: ReactNode }>;
  getLink?: (item: TModel) => string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: string;
  filters?: {
    [key: string]: unknown[];
  };
};

export function Table<TModel>({
  className = "min-w-full whitespace-nowrap",
  data,
  columns,
  mapper: Mapper,
  getLink,
  limit,
  offset,
  orderBy,
  direction,
  filters,
}: OrderedTableProps<TModel>) {
  const keys = Object.entries(columns)
    .filter((entry) => entry[1])
    .map(([key]) => key);

  const sortedArray = [...data];

  const [_, setSearchParams] = useSearchParams();

  return (
    <table
      className={cn(className, "text-[15px] border-separate border-spacing-0")}
    >
      <thead>
        <tr>
          {keys.map((key) => {
            const value = columns[key as keyof TableColumnOptions<TModel>];

            function getReactNode() {
              if (value && typeof value === "object" && "label" in value) {
                return value.label;
              }

              return value as ReactNode;
            }

            function Head() {
              const reactNode = getReactNode();

              if (typeof reactNode === "string") {
                return (
                  <button
                    className={cn(
                      orderBy === key
                        ? "text-gray-900 font-medium"
                        : "text-gray-500 font-medium",
                      "px-4 flex w-full",
                    )}
                    onClick={() => {
                      let newDirection = "asc";
                      if (orderBy === key) {
                        newDirection = direction === "asc" ? "desc" : "asc";
                      }
                      setSearchParams({
                        orderBy: key,
                        direction: newDirection,
                      });
                    }}
                  >
                    {reactNode}
                    {orderBy === key && (
                      <div className="ml-0.5">
                        {direction === "asc" ? <GoArrowUp /> : <GoArrowDown />}
                      </div>
                    )}
                  </button>
                );
              }

              return <>{reactNode}</>;
            }

            const filter = filters?.[key];

            return (
              <th
                key={key}
                className={cn("py-4 border-y font-normal align-top")}
              >
                <Head />
                {filter && (
                  <div className="px-3 mt-4">
                    <select
                      className="w-full h-10 px-1.5 border rounded-full outline-none"
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchParams((prev) => {
                          if (value) {
                            prev.set(key, encodeURIComponent(value));
                          } else {
                            prev.delete(key);
                          }
                          return prev;
                        });
                      }}
                    >
                      <option value="">전체</option>
                      {filter.map((option) => {
                        const column =
                          columns[key as keyof TableColumnOptions<TModel>];

                        if (
                          column &&
                          typeof column === "object" &&
                          "mapper" in column
                        ) {
                          const mapper = column.mapper;

                          if (mapper) {
                            const label = mapper(option as any, {} as TModel);

                            if (typeof label === "string") {
                              return (
                                <option
                                  key={option as string}
                                  value={option as string}
                                >
                                  {label}
                                </option>
                              );
                            }
                          }
                        }

                        return (
                          <option
                            key={option as string}
                            value={option as string}
                          >
                            {option as string}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedArray.length === 0 && (
          <tr>
            <td
              colSpan={keys.length}
              className="px-4 h-20 text-gray-400 text-center"
            >
              데이터가 없습니다.
            </td>
          </tr>
        )}
        {sortedArray.map((item, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            {keys.map((key, i) => {
              const value = (item as any)[key] as any;

              function Content() {
                if (key in columns) {
                  const column =
                    columns[key as keyof TableColumnOptions<TModel>];

                  if (
                    column &&
                    typeof column === "object" &&
                    "mapper" in column
                  ) {
                    const mapper = column.mapper;

                    if (mapper) {
                      return <>{mapper(value, item)}</>;
                    }
                  }
                }

                return <>{String(value)}</>;
              }

              const linkedContent = getLink ? (
                <Link
                  to={getLink(item)}
                  className="block content-center px-4 w-full h-full"
                >
                  <Content />
                </Link>
              ) : (
                <div className="px-4 w-full h-full content-center">
                  <Content />
                </div>
              );

              const cell = Mapper ? (
                <Mapper item={item} index={i}>
                  {linkedContent}
                </Mapper>
              ) : (
                linkedContent
              );

              return (
                <td key={key} className="px-0 h-14 border-b">
                  {cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
