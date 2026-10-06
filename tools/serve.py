# Local server mimicking Netlify: /foo -> foo.html, 404.html fallback.
import http.server, os, sys
ROOT=sys.argv[1]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def translate_path(s,path):
        p=super().translate_path(path.split('?')[0])
        if not os.path.exists(p) and os.path.exists(p+'.html'): return p+'.html'
        return p
    def log_message(s,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8765),H).serve_forever()
