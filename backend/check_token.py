
import os
from dotenv import load_dotenv
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

load_dotenv()

token = os.getenv("HF_TOKEN")

if not token or not token.startswith("hf_"):
    print("TOKEN MISSING OR INCORRECTLY FORMATTED")
else:
    request = Request(
        "https://huggingface.co/api/whoami-v2",
        headers={"Authorization": f"Bearer {token}"}
    )

    try:
        with urlopen(request, timeout=20) as response:
            print("HTTP status:", response.status)
            print("TOKEN AUTHENTICATION: VALID")
    except HTTPError as error:
        print("HTTP status:", error.code)
        print("TOKEN AUTHENTICATION: REJECTED")
    except URLError as error:
        print("Connection problem:", error.reason)
