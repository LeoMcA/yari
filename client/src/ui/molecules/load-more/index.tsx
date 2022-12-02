import { Button } from "../../atoms/button";

export default function LoadMore({
  atEnd,
  setSize,
  loading,
  error,
}: {
  atEnd: boolean;
  setSize: (arg: (size: number) => number) => void;
  loading: boolean;
  error: boolean;
}) {
  return !atEnd ? (
    <div className="pagination">
      <Button
        type="primary"
        onClickHandler={() => {
          setSize((size) => size + 1);
        }}
        isDisabled={loading}
      >
        {loading ? "Loading..." : error ? "Error (try again)" : "Show more"}
      </Button>
    </div>
  ) : null;
}
