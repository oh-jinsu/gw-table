import { cn } from "./cn";
import type {
  DetailedHTMLProps,
  FC,
  ReactNode,
  TableHTMLAttributes,
} from "react";
import { GoArrowDown, GoArrowUp } from "react-icons/go";
import { Link, useSearchParams } from "react-router";

export type TableColumn<TModel, TKey extends keyof TModel> = {
  head?: ReactNode;
  key?: TKey;
  render?: (value: TModel[TKey], item: TModel) => ReactNode;
  sort?: (a: TModel, b: TModel) => number;
};

export function column<TModel, TKey extends keyof TModel>(
  options:
    | {
        key: TKey;
        head?: ReactNode;
        render?: (value: TModel[TKey], item: TModel) => ReactNode;
        sort?: (a: TModel, b: TModel) => number;
      }
    | {
        head?: ReactNode;
        render?: (value: TModel[TKey], item: TModel) => ReactNode;
        sort?: (a: TModel, b: TModel) => number;
      },
): TableColumn<TModel, TKey> {
  return options;
}

export type TableProps<TModel> = DetailedHTMLProps<
  TableHTMLAttributes<HTMLTableElement>,
  HTMLTableElement
> & {
  data: TModel[];
  columns: TableColumn<TModel, any>[];
  render?: FC<{ item: TModel; index: number; children: ReactNode }>;
  getLink?: (item: TModel) => string;
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
  getLink,
  orderBy,
  direction,
  filters,
}: TableProps<TModel>) {
  const sortedArray = [...data];

  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <table
      className={cn(className, "text-[15px] border-separate border-spacing-0")}
    >
      <thead>
        <tr>
          {columns.map((column, i) => {
            const key = column.key;

            function Content() {
              if (column && typeof column === "object" && "head" in column) {
                return column.head;
              }

              return <></>;
            }

            function Head() {
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
                  <Content />
                  {orderBy === key && (
                    <div className="ml-0.5">
                      {direction === "asc" ? <GoArrowUp /> : <GoArrowDown />}
                    </div>
                  )}
                </button>
              );
            }

            function HeadFilter() {
              const filter = filters?.[key];

              if (!filter) {
                return;
              }

              return (
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
                    defaultValue={decodeURIComponent(
                      searchParams.get(key) || "",
                    )}
                  >
                    <option value="">전체</option>
                    {filter.map((option) => {
                      function OptionContent() {
                        if (
                          column &&
                          typeof column === "object" &&
                          "render" in column
                        ) {
                          const render = column.render;

                          if (render) {
                            const head = render(option as any, {} as TModel);

                            if (typeof head === "string") {
                              return head;
                            }
                          }
                        }

                        return option as string;
                      }

                      return (
                        <option key={option as string} value={option as string}>
                          <OptionContent />
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            }

            return (
              <th
                key={key || i}
                className={cn("py-4 border-y font-normal align-top")}
              >
                <Head />
                <HeadFilter />
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedArray.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 h-20 text-gray-400 text-center"
            >
              데이터가 없습니다.
            </td>
          </tr>
        )}
        {sortedArray.map((item, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            {columns.map((column, j) => {
              const key = column.key;

              function Content() {
                const column = columns.find((col) => col.key === key);

                const value = (item as any)[key] as any;

                if (
                  column &&
                  typeof column === "object" &&
                  "render" in column
                ) {
                  const render = column.render;

                  if (render) {
                    return <>{render(value, item)}</>;
                  }
                }

                return <>{String(value)}</>;
              }

              function ContentContainer({ children }: { children: ReactNode }) {
                if (getLink) {
                  return (
                    <Link
                      to={getLink(item)}
                      className="block content-center px-4 w-full h-full"
                    >
                      {children}
                    </Link>
                  );
                }

                return (
                  <div className="px-4 w-full h-full content-center">
                    {children}
                  </div>
                );
              }

              return (
                <td key={key || j} className="px-0 h-14 border-b">
                  <ContentContainer>
                    <Content />
                  </ContentContainer>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
