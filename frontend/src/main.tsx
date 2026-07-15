  import React from 'react';
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
  
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
  
    render() {
      if (this.state.hasError) {
        return <div style={{ padding: 40, color: 'white', background: 'red', zIndex: 999999, position: 'fixed', inset: 0 }}>
          <h1>App Crashed</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>;
      }
      return this.props.children;
    }
  }

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );