export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      {text && <p className="mt-3 text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
}
