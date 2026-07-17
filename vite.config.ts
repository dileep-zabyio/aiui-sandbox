import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom local dev proxy plugin to strip X-Frame-Options and Content-Security-Policy headers,
// whitelisting websites to be loaded within local application iframes.
const corsProxyPlugin = () => ({
  name: 'cors-proxy-plugin',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/cors-proxy')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end('Missing url query parameter');
          return;
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          });

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          res.statusCode = response.status;

          // Forward headers but strip framing restrictions and encoding compression
          response.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey !== 'x-frame-options' && 
              lowerKey !== 'content-security-policy' &&
              lowerKey !== 'content-security-policy-report-only' &&
              lowerKey !== 'content-encoding'
            ) {
              res.setHeader(key, value);
            }
          });

          // Inject access control
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(buffer);
        } catch (error) {
          res.statusCode = 500;
          res.end(`CORS Proxy failed: ${error}`);
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), corsProxyPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      '/firecrawl': {
        target: 'https://fc.zaby.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/firecrawl/u, ''),
      },
    },
  },
})
