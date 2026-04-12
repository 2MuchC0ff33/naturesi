#!/usr/bin/env python3
"""
Simple development HTTP server that serves files from the pages/ directory
and provides a helper endpoint /__set_localstorage which accepts query params
`cart` (URL-encoded JSON) and `to` (path to redirect to). The endpoint
returns a small HTML page that sets localStorage['naturesi_cart'] and then
redirects to `to` so headless browsers can set origin-localStorage for tests.

Usage: python3 scripts/dev_server.py [port]
"""
import http.server
import socketserver
import urllib.parse
import os
import json
import sys


PAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'pages')


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve files out of pages/ directory by default
        if path.startswith('/__set_localstorage'):
            return None
        # strip leading /
        rel = path.lstrip('/')
        p = os.path.join(PAGES_DIR, rel)
        if os.path.isdir(p):
            # serve index.html
            p = os.path.join(p, 'index.html')
        return p

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/__set_localstorage':
            qs = urllib.parse.parse_qs(parsed.query)
            cart_vals = qs.get('cart', [''])[0]
            to = qs.get('to', ['/'])[0]
            # cart_vals is URL-encoded JSON; percent-decode it
            try:
                cart_json = urllib.parse.unquote_plus(cart_vals)
            except Exception:
                cart_json = ''
            # Safely JSON-encode into JS string
            try:
                cart_obj = json.loads(cart_json) if cart_json else None
            except Exception:
                cart_obj = None

            # Create HTML that sets localStorage and redirects
            js_cart = json.dumps(cart_obj) if cart_obj is not None else 'null'
            html = f"""<!doctype html><html><head><meta charset=\"utf-8\"><title>Set cart</title></head><body>
<script>
try {{
  if ({js_cart} !== null) {{
    localStorage.setItem('naturesi_cart', JSON.stringify({js_cart}));
  }} else {{
    localStorage.removeItem('naturesi_cart');
  }}
}} catch(e) {{ /* ignore */ }}
window.location.href = '{to}';
</script>
</body></html>"""
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(html.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
            return

        # Fallback: serve static files from pages/ (use parent implementation)
        # Map path to file under pages/
        parsed_path = urllib.parse.urlparse(self.path).path.lstrip('/')
        fs_path = os.path.join(PAGES_DIR, parsed_path)
        if os.path.isdir(fs_path):
            fs_path = os.path.join(fs_path, 'index.html')
        if os.path.exists(fs_path) and os.path.isfile(fs_path):
            # serve file
            with open(fs_path, 'rb') as fh:
                data = fh.read()
            self.send_response(200)
            ctype = self.guess_type(fs_path)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Not found
        self.send_error(404, 'File not found')


def run(port=8000):
    os.chdir(os.getcwd())
    with socketserver.TCPServer(('0.0.0.0', port), DevHandler) as httpd:
        print(f"Serving pages/ on port {port} (helper: /__set_localstorage)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('Server stopped')


if __name__ == '__main__':
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run(p)
