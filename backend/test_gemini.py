"""
Standalone Gemini connectivity test script.
Run with: python3 test_gemini.py
"""
from pathlib import Path
import traceback

import google.generativeai as genai
from dotenv import load_dotenv
import os


def main() -> None:
    # project root is one level up from backend/
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        print(f"GEMINI_API_KEY not found in {env_path}")
        return

    print(f"Loaded GEMINI_API_KEY from: {env_path}")
    print(f"Using key prefix: {api_key[:5]}...")

    try:
        genai.configure(api_key=api_key)

        print("Checking models that support generateContent...")
        models = list(genai.list_models())
        supported = []
        for model_info in models:
            methods = getattr(model_info, "supported_generation_methods", []) or []
            if "generateContent" in methods:
                supported.append(getattr(model_info, "name", ""))

        if supported:
            print("Available generateContent models:")
            for name in supported:
                print(f"  - {name}")
        else:
            print("No generateContent models were returned for this key/API version.")

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Say hello world")
        print("Gemini call succeeded.")
        print("Response text:")
        print(response.text)
    except Exception:
        print("Gemini call failed with traceback:")
        traceback.print_exc()


if __name__ == "__main__":
    main()
