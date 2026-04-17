import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center space-y-6">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            The application encountered an unexpected error. We apologize for the inconvenience. 
            {this.state.error && (
              <span className="block mt-4 p-4 bg-muted rounded-lg text-xs font-mono text-left overflow-auto max-h-40">
                {this.state.error.message}
              </span>
            )}
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.reload()}
            className="rounded-full font-bold px-8 mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
