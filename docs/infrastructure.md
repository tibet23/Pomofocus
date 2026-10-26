Markdown

# Cloud Infrastructure & Edge Routing

To ensure global scalability, protect origin resources, and optimize Core Web Vitals, `pomofocus.live` leverages Cloudflare's Edge network. This document outlines the custom infrastructure rules and architectural decisions implemented to serve this Next.js application efficiently.

## 1. Edge Caching & Origin Offloading

By default, Next.js serves static assets efficiently, but routing all global traffic to a single origin server introduces unnecessary latency and compute overhead. 

We implemented **Custom Cache Rules** at the edge to intercept and serve static frontend chunks directly from Cloudflare's memory:
* **Target:** `URI Path starts with /_next/static/`
* **Action:** Override origin Cache-Control headers and force an Edge TTL of 1 month.
* **Impact:** Radically reduced origin bandwidth and request volume. Returning visitors load the core JavaScript bundles in under 100ms globally, bypassing the Next.js origin entirely and raising cache hit ratios during traffic spikes.

## 2. Canonical Domain Normalization & Edge Redirects

To prevent split domain authority, eliminate duplicate-content penalties in search engines, and enforce uniform TLS sessions, a permanent edge redirect rule was implemented:

* **Rule Expression:** `http.host eq "www.pomofocus.live"`
* **Target:** `https://pomofocus.live/$1`
* **Status Code:** `301 Moved Permanently`
* **Architectural Rationale:** 
  * **Link Equity Preservation:** Prevents search engines (Googlebot, Bingbot) from splitting backlink equity and index authority between apex and `www` hostnames.
  * **Zero Origin Hits:** Cloudflare evaluates the host header and handles the 301 response entirely at the Anycast edge, ensuring zero origin round-trips for non-canonical queries.
  * **Search Console Synchronization:** Canonical targets were verified and mapped across Google Search Console and Bing Webmaster Tools alongside the dynamic `sitemap.xml` and `robots.txt`.

## 3. Web Application Firewall (WAF) & Security

To preserve server resources, maintain a zero-telemetry philosophy, and ensure analytics reflect 100% genuine human traffic, we engineered custom WAF rules to drop automated background noise at the edge.

### Blocking Vulnerability Scanners
Automated bots continuously probe for standard CMS or repository vulnerabilities. We block these using a single, consolidated WAF rule:
* **Expression:** `(URI Path contains "wp-") OR (URI Path contains "xmlrpc.php") OR (URI Path contains ".git")`
* **Action:** Block
* **Engineering Rationale:** Instead of creating separate rules for WordPress probes and exposed Git repository checks, using `OR` logic consolidates multiple attack vectors into a single rule execution. Changing specific paths to root prefixes (`wp-`) ensures we catch all variants, as this Next.js app will never legitimately serve those paths.

### Blocking Headless Scrapers
To prevent automated harvesting, unauthorized API probing, and artificial inflation of visitor metrics, we filter out common headless script libraries:
* **Expression:** `(User Agent contains "python") OR (User Agent contains "httpx") OR (User Agent contains "curl")`
* **Action:** Block
* **Impact:** Protects database connections and origin CPU during traffic spikes by dropping non-human bot waves (which previously accounted for over 20% of inbound request volume).

## 4. Network & Delivery Optimizations

To tackle last-mile network latency and ensure the timer feels instantaneous on any device, we enabled modern delivery protocols:

* **HTTP/3 (QUIC):** Upgraded from HTTP/2 to HTTP/3 (UDP-based). This eliminates head-of-line blocking, ensuring that mobile users experiencing minor packet loss on cellular networks do not experience frozen page loads.
* **103 Early Hints:** Instructs Cloudflare to send preliminary headers to the browser before the Next.js server finishes compiling the HTML document. The browser begins downloading critical CSS and JavaScript bundles in parallel, drastically reducing the Largest Contentful Paint (LCP) and protecting the application's Core Web Vitals for search rankings.