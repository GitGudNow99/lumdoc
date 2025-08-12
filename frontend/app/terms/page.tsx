export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By using grandMA3 Docs Search, you agree to these terms. If you don't agree, 
        please don't use the service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        grandMA3 Docs Search provides AI-powered search for grandMA3 lighting console 
        documentation. The service searches official documentation and provides answers 
        with citations.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>You agree to:</p>
      <ul>
        <li>Use the service for legitimate documentation searches</li>
        <li>Not attempt to overload or abuse the service</li>
        <li>Not scrape or automatically query the service excessively</li>
        <li>Respect rate limits (30 requests per minute)</li>
      </ul>

      <h2>4. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DO NOT GUARANTEE:
      </p>
      <ul>
        <li>The accuracy or completeness of search results</li>
        <li>That the service will be uninterrupted or error-free</li>
        <li>That results are suitable for professional use without verification</li>
      </ul>
      
      <p className="font-bold">
        Always verify critical information with official grandMA3 documentation.
      </p>

      <h2>5. Limitation of Liability</h2>
      <p>
        IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR 
        CONSEQUENTIAL DAMAGES ARISING FROM USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO:
      </p>
      <ul>
        <li>Lost profits or revenue</li>
        <li>Errors in show programming</li>
        <li>Equipment damage</li>
        <li>Performance issues</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        grandMA3 is a trademark of MA Lighting Technology GmbH. This service is not 
        affiliated with or endorsed by MA Lighting Technology GmbH.
      </p>
      <p>
        Documentation content belongs to MA Lighting Technology GmbH. We provide search 
        and citation services only.
      </p>

      <h2>7. User Feedback</h2>
      <p>
        Any feedback you provide may be used to improve the service without compensation 
        or attribution.
      </p>

      <h2>8. Rate Limiting</h2>
      <p>
        To ensure fair access:
      </p>
      <ul>
        <li>Search: 30 requests per minute</li>
        <li>Answer generation: 10 requests per minute</li>
        <li>Excessive use may result in temporary blocking</li>
      </ul>

      <h2>9. Privacy</h2>
      <p>
        Your use is subject to our <a href="/privacy" className="text-ma3-yellow hover:underline">Privacy Policy</a>.
      </p>

      <h2>10. Modifications</h2>
      <p>
        We may modify these terms at any time. Continued use constitutes acceptance of 
        modified terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We reserve the right to terminate or restrict access to anyone who violates these 
        terms or abuses the service.
      </p>

      <h2>12. Open Source</h2>
      <p>
        This service is open source. You may fork and self-host under the MIT license, 
        but you're responsible for your own deployment.
      </p>

      <h2>13. No Professional Advice</h2>
      <p>
        This service provides documentation search only. It is not a substitute for:
      </p>
      <ul>
        <li>Professional lighting design consultation</li>
        <li>Official MA Lighting support</li>
        <li>Safety-critical decision making</li>
      </ul>

      <h2>14. Governing Law</h2>
      <p>
        These terms are governed by the laws of the United States, without regard to 
        conflict of law provisions.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions about these terms, please open an issue on our GitHub repository.
      </p>

      <div className="mt-8 pt-8 border-t border-zinc-800">
        <a href="/" className="text-ma3-yellow hover:underline">← Back to Search</a>
      </div>
    </div>
  );
}