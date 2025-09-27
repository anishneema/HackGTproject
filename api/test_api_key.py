# test_api_key.py
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

print(f"API Key loaded: {bool(openai.api_key)}")
print(f"Key starts with: {openai.api_key[:10] if openai.api_key else 'None'}")

try:
    client = openai.OpenAI(api_key=openai.api_key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=5
    )
    print("✅ API Key is valid!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ API Key error: {e}")
    print(f"Error type: {type(e).__name__}")
    
    # Check for specific error types
    if "Invalid API key" in str(e):
        print("🔑 Your API key is invalid or malformed")
    elif "Insufficient credits" in str(e):
        print("💳 You need to add credits to your OpenAI account")
    elif "Rate limit" in str(e):
        print("⏰ Rate limit exceeded - try again later")
    else:
        print("❓ Unknown error - check your internet connection and API key")
