import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import appLogo from "@/assets/app-logo.png";

interface DottedBackgroundLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  showLogo?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const DottedBackgroundLayout = ({
  children,
  showBackButton = true,
  showLogo = true,
  maxWidth = "md",
  className,
}: DottedBackgroundLayoutProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const maxWidthClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[600px]",
    lg: "max-w-[800px]",
    xl: "max-w-[1000px]",
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--site-bg))] flex flex-col">
      {/* Fixed dotted background */}
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none",
          theme === "dark" 
            ? "bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)]"
            : "bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)]",
          "[background-size:16px_16px]"
        )}
      />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Back button */}
        {showBackButton && (
          <div className="p-6">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
        
        {/* Main content area */}
        <div className={cn(
          "flex-1 flex flex-col items-center px-4 pb-12",
          showBackButton ? "pt-4" : "pt-12",
          className
        )}>
          {/* Logo */}
          {showLogo && (
            <img src={appLogo} alt="Logo" className="w-16 h-16 mb-8" />
          )}
          
          {/* Content card */}
          <div className={cn(
            "w-full",
            maxWidthClasses[maxWidth]
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DottedBackgroundLayout;
