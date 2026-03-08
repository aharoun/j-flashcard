#!/usr/bin/env python3
"""Local dev server that serves static files and proxies jisho.org API requests."""
import http.server
import urllib.request
import urllib.parse
import json

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/jisho?'):
            query = urllib.parse.urlparse(self.path).query
            url = f'https://jisho.org/api/v1/search/words?{query}'
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'JapaneseFlashcardApp/1.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            super().do_GET()

if __name__ == '__main__':
    print('Serving at http://localhost:8000')
    http.server.HTTPServer(('', 8000), Handler).serve_forever()
