export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Overview</h2>
      <p>
        grandMA3 Docs Search ("we", "our", "the service") is committed to protecting your privacy. 
        This policy explains what information we collect and how we use it.
      </p>

      <h2>Information We Collect</h2>
      <h3>Automatically Collected</h3>
      <ul>
        <li>IP address (for rate limiting)</li>
        <li>Search queries (cached anonymously)</li>
        <li>Page views and performance metrics</li>
        <li>Error logs (without personal data)</li>
      </ul>

      <h3>Information We Don't Collect</h3>
      <ul>
        <li>Personal identification information</li>
        <li>Email addresses</li>
        <li>Cookies for tracking</li>
        <li>Third-party analytics that identify users</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li><strong>Search queries:</strong> Cached for 15 minutes to improve performance</li>
        <li><strong>IP addresses:</strong> Used only for rate limiting, not stored</li>
        <li><strong>Analytics:</strong> Aggregated data to improve the service</li>
        <li><strong>Feedback:</strong> Optional feedback to improve search quality</li>
      </ul>

      <h2>Data Storage</h2>
      <p>
        All data is processed through:
      </p>
      <ul>
        <li>Vercel (hosting and edge functions)</li>
        <li>Upstash (caching and vector search)</li>
        <li>Algolia (search index)</li>
        <li>OpenAI (query processing - no storage)</li>
      </ul>

      <h2>Data Retention</h2>
      <ul>
        <li>Search cache: 15 minutes</li>
        <li>Feedback: 30 days</li>
        <li>Error logs: 7 days</li>
        <li>Analytics: Aggregated indefinitely</li>
      </ul>

      <h2>Your Rights</h2>
      <p>
        Since we don't collect personal data, there's nothing to delete or export. 
        You can use the service without providing any personal information.
      </p>

      <h2>Security</h2>
      <p>
        We implement industry-standard security measures including:
      </p>
      <ul>
        <li>HTTPS encryption for all traffic</li>
        <li>Rate limiting to prevent abuse</li>
        <li>Regular security updates</li>
        <li>No storage of sensitive data</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>
        We use the following services which have their own privacy policies:
      </p>
      <ul>
        <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel</a></li>
        <li><a href="https://upstash.com/privacy" target="_blank" rel="noopener">Upstash</a></li>
        <li><a href="https://www.algolia.com/policies/privacy/" target="_blank" rel="noopener">Algolia</a></li>
        <li><a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener">OpenAI</a></li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update this policy. Check this page for the latest version.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about this policy, please open an issue on our GitHub repository.
      </p>

      <div className="mt-8 pt-8 border-t border-zinc-800">
        <a href="/" className="text-ma3-yellow hover:underline">← Back to Search</a>
      </div>
    </div>
  );
}