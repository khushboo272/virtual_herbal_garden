import React from 'react';

export interface ModelErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: (error: Error) => void;
  children: React.ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[ModelErrorBoundary] GLTF model load failed:', error.message, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

