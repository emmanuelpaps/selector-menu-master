import urllib.request
try:
    url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Jabil_Circuit_Logo.svg'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    with urllib.request.urlopen(req) as response:
        svg = response.read()
    with open('src/assets/logo_jabil.svg', 'wb') as f:
        f.write(svg)
    print("Downloaded successfully")
except Exception as e:
    print(f"Error: {e}")
