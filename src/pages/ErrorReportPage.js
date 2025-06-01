export default class ErrorReportPage {
  constructor() {
    this.name = 'ErrorReportPage';
  }

  render() {
    return `
      <div class="page-container">
        <div class="card">
          <h1>Report an Error</h1>
          <p>This page will contain error reporting functionality including:</p>
          <ul>
            <li>Error type selection (spelling, audio, content)</li>
            <li>Description form</li>
            <li>Screenshot upload</li>
            <li>Report status tracking</li>
            <li>User's report history</li>
          </ul>
          <p><em>Coming soon in Step 8 of the implementation...</em></p>
        </div>
      </div>
    `;
  }

  mount() {
    console.log('ErrorReport page mounted');
  }

  cleanup() {
    console.log('ErrorReport page cleanup');
  }
} 