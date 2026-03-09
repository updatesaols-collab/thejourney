"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  resetKey?: string | number;
};

type State = {
  hasError: boolean;
};

export default class ModalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Modal crashed", error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="modal__content surface modal-error" role="alert">
        <div className="modal__header">
          <div>
            <p className="eyebrow">Something went wrong</p>
            <h2>{this.props.title ?? "This form could not open"}</h2>
          </div>
          {this.props.onClose ? (
            <button
              type="button"
              className="modal__close modal__close-button"
              onClick={this.props.onClose}
            >
              Close
            </button>
          ) : null}
        </div>
        <p className="list-meta">
          This modal hit an error, but the rest of the page is still working.
        </p>
        <div className="modal-error__actions">
          <button type="button" className="button button--ghost" onClick={this.handleRetry}>
            Try again
          </button>
          {this.props.onClose ? (
            <button
              type="button"
              className="button button--secondary"
              onClick={this.props.onClose}
            >
              Close modal
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}
