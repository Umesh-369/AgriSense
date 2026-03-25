import os
import io
import json
import traceback
import httpx
from pathlib import Path
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image
from google import genai

# Load environment variables from the directory containing this script
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="AgriVision API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - Get API Key from Environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set in environment!")

# Initialize the new google.genai client
client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash"

SYSTEM_PROMPT = """You are AgriBot, an elite agricultural analyst. 
STRICT OUTPUT RULES:
1. Start with a single [OVERVIEW] sentence.
2. Immediately follow with [KEY FINDINGS].
3. Under [KEY FINDINGS], provide a list of 3-5 distinct bullet points using hyphens (-).
4. Each bullet point must be short, concise, and bold key terms using **markdown**.
5. Do NOT write paragraphs inside the bullet points.
6. NO conversational filler.

Example Output:
[OVERVIEW]
Paddy is a wetland crop requiring significant water management.
[KEY FINDINGS]
- **Definition**: Unmilled rice grain enclosed in the husk.
- **Water Need**: Requires continuous flooding (10-15cm depth).
- **Climate**: Thrives in hot, humid tropical climates."""

class ChatRequest(BaseModel):
    message: str

class TTSRequest(BaseModel):
    text: str

@app.get("/api/health")
async def health_check():
    return {"status": "AgriBot Online", "model": MODEL_NAME}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Handles agricultural queries using Gemini 2.5 Flash."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=request.message,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[genai.types.Tool(google_search=genai.types.GoogleSearch())],
            ),
        )

        text = response.text
        if not text:
            raise ValueError("Empty response from AI")

        return {"response": text}
    except Exception as e:
        print(f"Chat Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Agricultural data relay failed: {str(e)}")

@app.post("/api/tts")
async def tts_endpoint(request: TTSRequest):
    """TTS via Gemini is not available on current plan.
    The frontend will use the browser's built-in Web Speech API instead."""
    raise HTTPException(
        status_code=501,
        detail="Gemini TTS not available. Use browser SpeechSynthesis."
    )

# --- Crop Disease Detector Logic ---

@app.post("/analyze")
async def analyze_crop(image: UploadFile = File(...)):
    """
    Analyzes a crop image using Gemini 2.5 Flash.
    Returns disease name, severity, cure, and confidence.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    try:
        # 1. Read the image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        # 2. Construct Prompt
        prompt = """
        You are an expert plant pathologist AI. Analyze this image of a crop.
        
        1. First, check if the image actually contains a plant or crop. If not, set "is_crop" to false.
        2. If it is a plant, identify the specific disease (or say "Healthy" if none).
        3. Estimate the severity of the disease as a percentage (0 to 100).
        4. Provide a concise, practical recommendation/cure (max 2 sentences).
        5. Provide a confidence score (e.g., "98%").

        Return the result as a valid JSON object without any Markdown formatting or code blocks.
        Use this exact structure:
        {
            "is_crop": boolean,
            "disease": "string",
            "severity": integer,
            "cure": "string",
            "confidence": "string"
        }
        """

        # 3. Call Gemini API using the new google.genai SDK
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt, img],
        )

        # 4. Parse Response
        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()

        data = json.loads(response_text)

        # 5. Handle Non-Crop
        if not data.get("is_crop", True):
            return {
                "status": "error",
                "error": "No crop detected. Please upload a clear image of a plant leaf."
            }

        # 6. Return Data
        return {
            "status": "success",
            "disease": data.get("disease", "Unknown"),
            "severity": data.get("severity", 0),
            "cure": data.get("cure", "Consult an agronomist."),
            "confidence": data.get("confidence", "N/A")
        }

    except Exception as e:
        print(f"Error analyzing crop: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 AgriBot Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
