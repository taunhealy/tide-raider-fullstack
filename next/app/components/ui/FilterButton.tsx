// components/filters/FilterButton.tsx
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-primary ${
        active
          ? "bg-cyan-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}