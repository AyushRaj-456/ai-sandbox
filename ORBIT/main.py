import os
import json
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure GenAI
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# --- Simple In-Memory State for Approval Logic ---
execution_memory = {}

# --- Define Pydantic models for API Requests ---
class AnalyzeRequest(BaseModel):
    logs: str
    goal: Optional[str] = None

class RefineRequest(BaseModel):
    previous_output: dict
    instruction: str

class ApproveRequest(BaseModel):
    execution_id: str
    approved: bool

# --- Define Models for Output structure ---
class Issue(BaseModel):
    title: str
    severity: str = Field(description="Critical | Warning | Info")
    reason: str
    actions: List[str]

class LogAnalysisResponse(BaseModel):
    plan: List[str]
    root_cause: str
    issues: List[Issue]
    summary: str
    auto_fix_script: str
    risk_level: str = None
    approval_required: bool = False
    execution_id: Optional[str] = None

class ExecutionResponse(BaseModel):
    status: str
    execution_log: List[str]

app = FastAPI(
    title="AI Log Root Cause Analysis Agent", 
    description="Agentic endpoints to parse logs, propose fixes, and handle Human-In-The-Loop explicit approval execution."
)

# Set up static file serving for the frontend
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_frontend():
    """Serves the beautiful custom Web UI."""
    return FileResponse("static/index.html")

def preprocess_logs(logs: str) -> str:
    """Basic preprocessing: Removes completely empty lines."""
    lines = logs.split("\n")
    cleaned_lines = [line.strip() for line in lines if line.strip() != ""]
    return "\n".join(cleaned_lines)

def generate_hints(logs: str) -> str:
    """Auto Decision Layer: Basic heuristic rules engine to guide the LLM."""
    logs_lower = logs.lower()
    hints = []
    if "timeout" in logs_lower or "dead" in logs_lower:
        hints.append("- Rule Engine: Potential network or database infrastructure connection issue.")
    if "401" in logs_lower or "unauthorized" in logs_lower or "invalid api key" in logs_lower:
        hints.append("- Rule Engine: Potential identity, token, or permission failure.")
    if "memory" in logs_lower or "oom" in logs_lower:
        hints.append("- Rule Engine: Potential resource exhaustion / OutOfMemory issue.")
    
    if hints:
        return "Internal Decision Layer Hints:\n" + "\n".join(hints)
    return ""

EXPECTED_SCHEMA = {
  "plan": [
    "string (step 1)",
    "string (step 2)"
  ],
  "root_cause": "string",
  "issues": [
    {
      "title": "string",
      "severity": "Critical | Warning | Info",
      "reason": "string",
      "actions": [
        "string action 1",
        "string action 2"
      ]
    }
  ],
  "summary": "string",
  "auto_fix_script": "string (bash/shell commands)",
  "risk_level": "High | Medium | Low",
  "approval_required": True 
}

SYSTEM_PROMPT = f"""
You are a highly skilled Log Analysis DevOps Agent designed to SOLVE REAL SOFTWARE DEV PROBLEMS autonomously.

You will be analyzing software system logs. Logs are technical system messages containing timestamps, levels (INFO, ERROR, WARN), and technical events. Your goal is to instantly diagnose the true root cause cutting through thousands of lines of noise.

Your tasks:
1. Internal Planning: Before outputting, articulate your plan to diagnose the issue in steps.
2. Identify the real root cause of the system failure from the provided logs.
3. Group related errors and classify their severity: Critical, Warning, Info.
4. Execution Mode: Cut through the noise and suggest actionable step-by-step actions (NOT abstract fixes). Provide concrete operations a developer can do.
5. Automation Feature: Produce a fully viable CLI/Bash `auto_fix_script` summarizing the operations needed to patch or investigate it.
6. Approval Gate Logic: Determine the `risk_level` of your suggested fix. If it involves killing processes, restarting critical databases, changing configs, or dropping memory, set `risk_level` to "High" or "Medium" and ALWAYS set `approval_required: true`. Only entirely harmless actions should bypass approval.
7. Return ONLY valid JSON matching this exact schema:
{json.dumps(EXPECTED_SCHEMA, indent=2)}
"""

def get_gemini_model():
    """Helper to instantiate the GenAI model with strict JSON formatting config."""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in .env")
        
    return genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json"}
    )

@app.post("/analyze", response_model=LogAnalysisResponse)
async def analyze_logs(req: AnalyzeRequest):
    cleaned_logs = preprocess_logs(req.logs)
    hints = generate_hints(cleaned_logs)
    model = get_gemini_model()
    
    prompt = f"Analyze the following logs and provide the strict JSON structure:\n\n"
    if req.goal:
        prompt += f"USER DRIVEN GOAL: {req.goal}\n\n"
    if hints:
        prompt += f"{hints}\n\n"
        
    prompt += f"Logs:\n{cleaned_logs}"
    
    try:
        response = model.generate_content(prompt)
        result_str = response.text
        if result_str.startswith("```json"):
            result_str = result_str[7:].strip()
            if result_str.endswith("```"):
                result_str = result_str[:-3].strip()
                
        result_json = json.loads(result_str)
        
        # --- Backend Controller / State Injection Layer ---
        exec_id = str(uuid.uuid4())
        result_json["execution_id"] = exec_id
        
        execution_memory[exec_id] = {
             "script": result_json.get("auto_fix_script", ""),
             "status": "pending"
        }
        
        return result_json
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI output as JSON: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve", response_model=ExecutionResponse)
async def approve_and_execute(req: ApproveRequest):
    if req.execution_id not in execution_memory:
        raise HTTPException(status_code=404, detail="Execution ID not found or already processed.")
        
    job = execution_memory[req.execution_id]
    
    if not req.approved:
        job["status"] = "cancelled"
        return {
            "status": "Cancelled",
            "execution_log": ["[System] User rejected the proposed actions. Execution halted."]
        }
    
    job["status"] = "executing"
    script = job["script"]
    
    simulated_log = ["[System] Starting execution of autonomous recovery script..."]
    for line in script.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        simulated_log.append(f"[Running] {line}")
        simulated_log.append(f"          ... OK")
        
    simulated_log.append("[System] Autonomous execution successfully completed!")
    job["status"] = "completed"
    
    return {
        "status": "Successfully Executed",
        "execution_log": simulated_log
    }

@app.post("/refine", response_model=LogAnalysisResponse)
async def refine_analysis(req: RefineRequest):
    model = get_gemini_model()
    
    prompt = f"""
I have a previous log analysis Agent run, and the user has provided a new instruction to refine it.
Re-analyze and update the JSON result strictly according to the new instruction taking into account previous context.

Previous Result:
{json.dumps(req.previous_output, indent=2)}

User Instruction:
{req.instruction}
"""
    try:
        response = model.generate_content(prompt)
        result_str = response.text
        if result_str.startswith("```json"):
            result_str = result_str[7:].strip()
            if result_str.endswith("```"):
                result_str = result_str[:-3].strip()
        result_json = json.loads(result_str)
        
        exec_id = str(uuid.uuid4())
        result_json["execution_id"] = exec_id
        execution_memory[exec_id] = {
             "script": result_json.get("auto_fix_script", ""),
             "status": "pending"
        }
        
        return result_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
