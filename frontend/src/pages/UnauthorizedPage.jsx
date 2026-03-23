export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-3xl glass-panel p-10 text-center">
      <p className="eyebrow">Access denied</p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-950">You do not have permission to access this page.</h1>
      <p className="mt-4 text-sm text-slate-600">If you believe this is a mistake, sign in with an administrator account or return to the discover page.</p>
    </div>
  );
}
