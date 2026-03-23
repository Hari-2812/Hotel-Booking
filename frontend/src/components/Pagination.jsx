export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const pages = [];
  for (let value = Math.max(1, page - 2); value <= Math.min(totalPages, page + 2); value += 1) {
    pages.push(value);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      <button className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      {pages.map((value) => (
        <button
          key={value}
          className={value === page ? 'btn-primary min-w-11' : 'btn-secondary min-w-11'}
          onClick={() => onPageChange(value)}
        >
          {value}
        </button>
      ))}
      <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
