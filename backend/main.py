
import os
import base64

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv(override=True)

app = FastAPI(title="NOMAD API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://nomad-1-wb4n.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return {
        "project": "NOMAD",
        "status": "online",
        "message": "The world is the input.",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze-environment")
async def analyze_environment(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image.",
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_data) > 8 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 8 MB.",
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing from backend/.env.",
        )

    encoded_image = base64.b64encode(image_data).decode("utf-8")
    image_type = file.content_type

    prompt = """
You are NOMAD, an AI that turns real surroundings into meaningful
outdoor exploration missions.

Analyze the provided photograph carefully.

ENVIRONMENT:
Describe visible objects, surfaces, natural features, and surroundings.
Do not claim to know anything that cannot be seen.

MISSION TITLE:
Give this exploration mission a short, memorable name.

MISSION:
Create one original, engaging 5-10 minute mission that makes the user
notice and interact with their surroundings without staring at their phone.

STEPS:
Give three simple steps based on visible features in the image.

WHY THIS PLACE:
Explain which visible details inspired the mission.

SAFETY:
Keep the mission on accessible public ground. Do not ask the user to
enter roads, restricted areas, private property, water, or unsafe terrain.
Never ask the user to touch unknown objects, disturb wildlife, or approach
strangers. If the scene is unclear or indoors, suggest a safe observation
mission instead.

- INDOOR ENVIRONMENTS: If the image shows an indoor space, do not invent an outdoor location or encourage walking through dark or unfamiliar areas. Ask the user to move to a safe, accessible outdoor location before generating an outdoor exploration mission. Generate missions only from clearly visible environmental details and prioritize personal safety.


Be imaginative but grounded in the actual photograph.
Never invent objects or claim that a mission has been completed.
"""

    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

        response = client.chat.completions.create(
            model="gemini-3.8-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt,
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": (
                                    f"data:{image_type};base64,{encoded_image}"
                                )
                            },
                        },
                    ],
                }
            ],
            max_tokens=800,
        )

        analysis = response.choices[0].message.content

        if not analysis:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty response.",
            )

        return {
            "status": "analyzed",
            "filename": file.filename,
            "image_size": len(image_data),
            "model": "gemini-3.8-flash",
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except Exception as error:
        print(
            f"NOMAD Gemini error: {type(error).__name__}: {error}",
            flush=True,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Gemini error ({type(error).__name__}): {str(error)[:400]}",
        )


