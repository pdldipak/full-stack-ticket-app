import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary__root} role="alert" aria-live="assertive">
          <div className={styles.errorBoundary__inner}>
            <h1 className={styles.errorBoundary__title}>Something went wrong</h1>
            <p className={styles.errorBoundary__text}>
              Reload the page. If the problem continues, contact support.
            </p>
            <button type="button" className={styles.errorBoundary__reload} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
