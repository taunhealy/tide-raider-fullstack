interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
  }
  
  export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
    const sizeClass = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-10 h-10'
    }[size];
    
    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClass} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
      </div>
    );
  }