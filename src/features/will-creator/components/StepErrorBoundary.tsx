import { Component, ErrorInfo, ReactNode } from 'react';

interface StepErrorBoundaryProps {
  stepName: string;
  children: ReactNode;
  onReset?: () => void;
}

interface StepErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StepErrorBoundary extends Component<StepErrorBoundaryProps, StepErrorBoundaryState> {
  constructor(props: StepErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StepErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.stepName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 space-y-6 animate-in fade-in">
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600">Something went wrong in {this.props.stepName}</h3>
            <p className="text-sm text-red-600/80">
              An unexpected error occurred. You can try again or go back to the previous step.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-500/10 rounded-xl">
                <code className="text-xs text-red-700 break-all">{this.state.error.message}</code>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
