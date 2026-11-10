import urllib.request
import json

apiKey = 'AIzaSyBchIEyM-oFQ_OGC7QIrPuVOuB0yQEdm-w'
url = f'https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key={apiKey}'

def check_email(email):
    req = urllib.request.Request(
        url,
        data=json.dumps({'identifier': email, 'continueUri': 'http://localhost'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Email '{email}': registered = {data.get('registered')}")
    except Exception as e:
        print(f"Email '{email}' error: {e}")

check_email('nonexistent_user_992173@gmail.com')
check_email('test@gmail.com')

