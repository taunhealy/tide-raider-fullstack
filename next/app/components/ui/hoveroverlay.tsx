interface HoverOverlayProps {
  title: string;
  isVisible: boolean;
}

export function HoverOverlay({ title, isVisible }: HoverOverlayProps) {
  return (
    <div 
      className={`
        absolute bottom-4 right-4 
        bg-black bg-opacity-50 
        px-3 py-1 rounded-md 
        text-white text-sm 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {title}
    </div>
  );
}