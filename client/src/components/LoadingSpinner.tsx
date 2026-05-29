export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent"></div>
        <p className="mt-4 text-navy-600">Loading...</p>
      </div>
    </div>
  );
}
