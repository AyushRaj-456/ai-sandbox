import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
with open('models.json', 'w') as f:
    json.dump(models, f)
