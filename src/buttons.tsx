import { Link, useLocation, useSearchParams } from "react-router";
import { cn } from "./cn";

export function TablePageButtons({
  MAX_PAGES_TO_SHOW,
  total,
  limit,
  offset,
}: {
  MAX_PAGES_TO_SHOW: number;
  total: number;
  limit: number;
  offset: number;
}) {
  const pages = Math.ceil(total / limit);

  const { pathname } = useLocation();

  const [searchParams] = useSearchParams();

  const currentPage = Math.floor(offset / limit) + 1;

  const startButton =
    (Math.ceil(currentPage / MAX_PAGES_TO_SHOW) - 1) * MAX_PAGES_TO_SHOW;

  const endButton = Math.min(startButton + MAX_PAGES_TO_SHOW - 1, pages);

  if (pages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center my-16 gap-4 text-neutral-400">
      {startButton > 1 && (
        <Link
          to={(() => {
            searchParams.set("offset", String((startButton - 1) * limit));
            return `${pathname}?${searchParams.toString()}`;
          })()}
          className="w-10 block text-center transition-colors hover:text-primary"
        >
          이전
        </Link>
      )}
      {Array.from({
        length: Math.min(MAX_PAGES_TO_SHOW, pages - startButton),
      }).map((_, index) => {
        return (
          <Link
            key={index}
            to={(() => {
              searchParams.set("offset", String((startButton + index) * limit));
              return `${pathname}?${searchParams.toString()}`;
            })()}
            className={cn(
              "w-6 block text-center transition-colors",
              currentPage === startButton + index + 1
                ? "font-bold text-primary"
                : "hover:text-primary",
            )}
          >
            {startButton + index + 1}
          </Link>
        );
      })}
      {endButton < pages && (
        <Link
          to={(() => {
            searchParams.set("offset", String((endButton + 1) * limit));
            return `${pathname}?${searchParams.toString()}`;
          })()}
          className="w-10 block text-center transition-colors hover:text-primary"
        >
          다음
        </Link>
      )}
    </div>
  );
}
