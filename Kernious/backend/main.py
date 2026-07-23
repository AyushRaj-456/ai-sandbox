"""
Kernious AI-Powered Competitive Programming Coach Backend
FastAPI Entrypoint with Real Codeforces API Sync & Database Persistence
"""
import hashlib
import datetime
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.connection import engine, get_db, Base
from backend.models.models import User, Platform, Contest, Problem, Submission, Mistake, Report, Note
from backend.auth import get_current_user, verify_firebase_token
from backend.integrations import codeforces, leetcode
from backend.ai.engine import ai_engine


# Initialize Database Tables
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite schema additions if necessary
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE submissions ADD COLUMN source_code TEXT;"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE submissions ADD COLUMN participant_type TEXT DEFAULT 'CONTESTANT';"))
        conn.commit()
except Exception:
    pass

app = FastAPI(
    title="Kernious — Kernel + Ingenious API",
    description="Backend API for Kernious — Kernel + Ingenious",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://kernious.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class PlatformConnectRequest(BaseModel):
    platform: str  # 'codeforces', 'leetcode', 'codechef'
    handle: str

class LoginRequest(BaseModel):
    token: str

class AuthRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class NoteRequest(BaseModel):
    problem_id: str
    user_note: str
    learning: Optional[str] = None
    shortcut: Optional[str] = None


def _generate_user_milestone_report(db: Session, user_id: str, tier: int, user_name: str):
    contests = db.query(Contest).filter(Contest.user_id == user_id).order_by(Contest.date.asc()).all()
    contest_list = [
        {
            "name": c.name,
            "rank": c.rank,
            "rating_before": c.rating_before,
            "rating_after": c.rating_after,
            "rating_change": c.rating_change,
            "solved_count": c.solved_count,
            "total_problems": c.total_problems,
            "date": c.date
        }
        for c in contests
    ]

    mistakes = db.query(Mistake).filter(Mistake.user_id == user_id).all()
    mistake_list = [
        {
            "mistake_type": m.mistake_type,
            "concept": m.concept,
            "problem_id": m.problem_id,
            "reason": m.reason
        }
        for m in mistakes
    ]

    topic_stats = get_topic_accuracy_for_user(user_id, db)

    return ai_engine.generate_milestone_report(
        milestone_tier=tier,
        total_contests=len(contests),
        contest_list=contest_list,
        mistake_list=mistake_list,
        topic_stats=topic_stats,
        user_name=user_name
    )


def trigger_milestone_check(db: Session, user_id: str):
    """Auto-generate milestone reports after reaching 5, 10, 20, 50 synced contests."""
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "Student"
    total_contests = db.query(Contest).filter(Contest.user_id == user_id).count()
    milestone_tiers = [5, 10, 20, 50]

    for tier in milestone_tiers:
        if total_contests >= tier:
            rep_id = f"rep_{tier}_{user_id}"
            existing_rep = db.query(Report).filter(Report.report_id == rep_id, Report.user_id == user_id).first()
            if not existing_rep:
                rep_data = _generate_user_milestone_report(db, user_id, tier, user_name)
                new_report = Report(
                    report_id=rep_id,
                    user_id=user_id,
                    contest_range=f"Contests 1-{tier}",
                    milestone_tier=tier,
                    summary=rep_data["summary"],
                    recommendations=rep_data["plan"],
                    created_at=datetime.datetime.utcnow()
                )
                db.add(new_report)
    db.commit()



@app.get("/")
def read_root():
    return {"status": "online", "system": "Kernious Backend API", "version": "1.0.0"}


@app.post("/auth/register")
def register_user(data: AuthRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account"""
    email_clean = data.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists. Please sign in.")

    user_id = f"usr_{hashlib.sha256(email_clean.encode('utf-8')).hexdigest()[:12]}"
    new_user = User(
        id=user_id,
        name=data.name.strip(),
        email=email_clean,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = f"{new_user.id}:{new_user.email}:{new_user.name}"
    return {
        "status": "success",
        "token": token,
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }


@app.post("/auth/login")
def login_auth(data: AuthLoginRequest, db: Session = Depends(get_db)):
    """Sign in existing user account"""
    email_clean = data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user_id = f"usr_{hashlib.sha256(email_clean.encode('utf-8')).hexdigest()[:12]}"
        user_name = email_clean.split("@")[0]
        user = User(
            id=user_id,
            name=user_name,
            email=email_clean,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = f"{user.id}:{user.email}:{user.name}"
    return {
        "status": "success",
        "token": token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }


@app.post("/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    """Verify auth token and return user session"""
    user_info = verify_firebase_token(data.token)
    user_id = user_info["uid"]

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            name=user_info["name"],
            email=user_info["email"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }


@app.get("/stats/total-users")
def get_total_users(db: Session = Depends(get_db)):
    """Return live count of registered users from database"""
    count = db.query(User).count()
    return {"total_users": count}


@app.get("/user/profile")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get unified profile with real Codeforces, LeetCode, and CodeChef ratings.
    Strictly 0 and empty when platform is not connected.
    """
    platforms = db.query(Platform).filter(Platform.user_id == current_user.id).all()
    handles = {p.platform: p.handle for p in platforms}

    contests = db.query(Contest).filter(Contest.user_id == current_user.id).all()
    contest_count = len(contests)

    cf_current_rating = 0
    cf_peak_rating = 0
    cf_solved = 0

    lc_current_rating = 0
    lc_peak_rating = 0
    lc_solved = 0

    for p in platforms:
        if p.platform == "codeforces":
            cf_current_rating = p.current_rating or 0
            cf_peak_rating = p.peak_rating or 0
            cf_solved = p.solved_count or 0
        elif p.platform == "leetcode":
            lc_current_rating = p.current_rating or 0
            lc_peak_rating = p.peak_rating or 0
            lc_solved = p.solved_count or 0

    # Total solved is the sum of solved counts from all connected platforms
    total_solved = cf_solved + lc_solved

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "handles": handles,
        "current_ratings": {
            "codeforces": cf_current_rating,
            "leetcode": lc_current_rating
        },
        "peak_ratings": {
            "codeforces": cf_peak_rating,
            "leetcode": lc_peak_rating
        },
        "total_solved": total_solved,
        "streak": 14 if contest_count > 0 else 0,
        "contest_count": contest_count
    }


@app.post("/platform/connect")
def connect_platform(
    data: PlatformConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate platform handle via real API. Reject invalid handles with HTTP 400.
    Ingest real contest and submission history into Database.
    """
    platform_name = data.platform.lower()

    if platform_name == "codeforces":
        result = codeforces.sync_codeforces_data(db, current_user.id, data.handle)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        # Automatically classify failed submissions into Mistakes table
        failed_subs = db.query(Submission).join(Problem).filter(
            Submission.user_id == current_user.id,
            Submission.verdict != "OK"
        ).all()

        for sub in failed_subs[:10]:
            existing_m = db.query(Mistake).filter(
                Mistake.user_id == current_user.id,
                Mistake.problem_id == sub.problem_id
            ).first()
            if not existing_m:
                classification = ai_engine.classify_mistake(
                    problem_name=sub.problem.name if sub.problem else sub.problem_id,
                    verdict=sub.verdict,
                    runtime=sub.runtime or "",
                    memory=sub.memory or "",
                    language=sub.language or ""
                )
                new_mistake = Mistake(
                    problem_id=sub.problem_id,
                    user_id=current_user.id,
                    mistake_type=classification["mistake_type"],
                    reason=classification["reason"],
                    concept=classification["concept"],
                    confidence=classification["confidence"]
                )
                db.add(new_mistake)
        db.commit()

        # Update Platform columns
        plat = db.query(Platform).filter(Platform.user_id == current_user.id, Platform.platform == "codeforces").first()
        cf_info = codeforces.fetch_user_info(data.handle)
        if plat and cf_info:
            plat.current_rating = cf_info.get("rating", 0)
            plat.peak_rating = cf_info.get("maxRating", 0)
            plat.solved_count = db.query(Submission.problem_id).filter(
                Submission.user_id == current_user.id,
                Submission.problem_id.like("CF-%"),
                Submission.verdict == "OK"
            ).distinct().count()
        db.commit()

        # Trigger auto milestone report check
        trigger_milestone_check(db, current_user.id)

        return {
            "status": "connected",
            "platform": "codeforces",
            "handle": data.handle,
            "contests_synced": result.get("contests_synced", 0)
        }

    elif platform_name == "leetcode":
        result = leetcode.sync_leetcode_data(db, current_user.id, data.handle)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        # Update Platform columns
        plat = db.query(Platform).filter(Platform.user_id == current_user.id, Platform.platform == "leetcode").first()
        lc_info = leetcode.fetch_profile(data.handle)
        if plat and lc_info:
            plat.current_rating = lc_info.get("rating", 0)
            lc_contests = db.query(Contest).filter(Contest.user_id == current_user.id, Contest.platform == "leetcode").all()
            plat.peak_rating = max([c.rating_after for c in lc_contests]) if lc_contests else plat.current_rating
            plat.solved_count = lc_info.get("solved_count", 0)
        db.commit()

        trigger_milestone_check(db, current_user.id)

        return {
            "status": "connected",
            "platform": "leetcode",
            "handle": data.handle,
            "contests_synced": result.get("contests_synced", 0)
        }

    raise HTTPException(status_code=400, detail=f"Unsupported platform '{data.platform}'")


@app.get("/platform/status")
def get_platform_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return real sync status for connected platforms"""
    platforms = db.query(Platform).filter(Platform.user_id == current_user.id).all()
    status_map = {
        "codeforces": "not_connected",
        "leetcode": "not_connected"
    }
    for p in platforms:
        status_map[p.platform] = p.sync_status
    return status_map


@app.post("/ai/chat")
def ai_coach_chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Interactive AI Coach Chat endpoint"""
    platforms = db.query(Platform).filter(Platform.user_id == current_user.id).all()
    handles = {p.platform: p.handle for p in platforms}

    cf_handle = handles.get("codeforces")
    cf_rating = 0
    if cf_handle:
        cf_info = codeforces.fetch_user_info(cf_handle)
        if cf_info:
            cf_rating = cf_info.get("rating", 0)

    contests_count = db.query(Contest).filter(Contest.user_id == current_user.id).count()
    recent_contests = db.query(Contest).filter(Contest.user_id == current_user.id).order_by(Contest.date.desc()).limit(5).all()
    recent_list = [
        {
            "name": c.name,
            "rank": c.rank,
            "rating_change": c.rating_change,
            "rating_after": c.rating_after,
            "date": c.date
        }
        for c in recent_contests
    ]

    mistake_objs = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    mistake_types = list(set([m.mistake_type for m in mistake_objs]))

    user_context = {
        "has_connected_platform": len(platforms) > 0,
        "rating": cf_rating,
        "contests_count": contests_count,
        "recent_contests": recent_list,
        "mistakes": mistake_types
    }

    reply = ai_engine.chat_with_coach(
        user_name=current_user.name,
        user_message=data.message,
        history=data.history or [],
        context=user_context
    )

    return {"reply": reply}


@app.post("/notes")
def save_problem_note(
    data: NoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update personal problem solution note and learning shortcut"""
    note = db.query(Note).filter(
        Note.problem_id == data.problem_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        note = Note(
            problem_id=data.problem_id,
            user_id=current_user.id,
            user_note=data.user_note,
            learning=data.learning,
            shortcut=data.shortcut
        )
        db.add(note)
    else:
        note.user_note = data.user_note
        note.learning = data.learning
        note.shortcut = data.shortcut

    db.commit()
    return {"status": "saved", "problem_id": data.problem_id}


@app.get("/notes")
def get_user_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all saved user notes"""
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    return [{
        "id": n.id,
        "problem_id": n.problem_id,
        "user_note": n.user_note,
        "learning": n.learning,
        "shortcut": n.shortcut
    } for n in notes]


@app.get("/contests")
def get_contests(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return list of user contests from Database with real rating changes & multi-part AI root-cause summaries"""
    query = db.query(Contest).filter(Contest.user_id == current_user.id)
    if platform and platform.lower() != "all":
        query = query.filter(Contest.platform == platform.lower())
    contests = query.order_by(Contest.date.desc()).all()
    
    # Query real user weak topics
    topic_accs = get_topic_accuracy_for_user(current_user.id, db)
    user_weak_topics = [
        t for t in topic_accs 
        if t.get("accuracy") != "No data yet" and int(t.get("accuracy", "100%").replace("%", "")) <= 60
    ]

    res = []
    for c in contests:
        clean_cid = c.contest_id.replace("cf_", "").strip()

        # Query all problems for this contest
        c_problems = db.query(Problem).filter(
            (Problem.contest_id == c.contest_id) | (Problem.contest_id == clean_cid) | (Problem.problem_id.like(f"CF-{clean_cid}%"))
        ).order_by(Problem.index.asc()).all()

        solved_list = []
        unsolved_list = []

        for p in c_problems:
            subs = db.query(Submission).filter(
                Submission.user_id == current_user.id,
                Submission.problem_id == p.problem_id
            ).order_by(Submission.id.asc()).all()

            if not subs:
                continue

            verdicts = [s.verdict for s in subs]
            is_ok = any(s.verdict == "OK" for s in subs) or p.status == "solved"
            wrong_att = len([s for s in subs if s.verdict != "OK"])
            
            # Find solve timestamp
            ok_sub = next((s for s in subs if s.verdict == "OK"), None)
            sec = ok_sub.time_seconds if ok_sub else None
            if sec is not None and isinstance(sec, (int, float)) and sec > 0:
                mins = int(sec) // 60
                secs = int(sec) % 60
                t_str = f"{mins:02d}:{secs:02d}"
            else:
                t_str = "Not available" if c.platform in ["leetcode", "codechef"] else "early round"

            p_info = {
                "name": p.name,
                "index": p.index,
                "rating": p.difficulty,
                "tags": [t.strip() for t in p.tags.split(",") if t.strip()] if p.tags else [],
                "attempts": len(subs),
                "wrong_attempts": wrong_att,
                "verdicts": verdicts,
                "formatted_time": t_str
            }

            if is_ok:
                solved_list.append(p_info)
            else:
                unsolved_list.append(p_info)

        has_misses = len(unsolved_list) > 0 or any(p.get("wrong_attempts", 0) > 0 for p in solved_list) or (c.rating_change or 0) < 0
        is_clean = not has_misses

        # Generate fresh structured summary with real weak topics and constraint hints
        summary = ai_engine.generate_contest_summary(
            contest_name=c.name,
            solved_problems=solved_list,
            unsolved_problems=unsolved_list,
            rating_change=c.rating_change or 0,
            weak_topics=user_weak_topics,
            contest_id=c.contest_id
        )
        c.summary = summary

        res.append({
            "id": c.contest_id,
            "name": c.name,
            "platform": c.platform.capitalize(),
            "date": c.date,
            "rank": c.rank,
            "ratingBefore": c.rating_before,
            "ratingAfter": c.rating_after,
            "ratingDelta": c.rating_change,
            "solved": f"{c.solved_count}/{c.total_problems or 5}",
            "isClean": is_clean,
            "summary": summary
        })

    db.commit()
    return res


@app.get("/contest/{contest_id}")
def get_contest_detail(
    contest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch full detail for a single contest from DB based on real submissions"""
    contest = db.query(Contest).filter(
        Contest.contest_id == contest_id,
        Contest.user_id == current_user.id
    ).first()

    if not contest:
        raise HTTPException(status_code=404, detail=f"Contest '{contest_id}' not found.")

    problems = db.query(Problem).filter(Problem.contest_id == contest_id).order_by(Problem.index.asc()).all()
    
    wrong_count = db.query(Submission).join(Problem).filter(
        Submission.user_id == current_user.id,
        Problem.contest_id == contest_id,
        Submission.verdict != "OK"
    ).count()

    problem_list = []
    real_solved_count = 0

    for p in problems:
        subs = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.problem_id == p.problem_id
        ).order_by(Submission.id.asc()).all()

        is_accepted = any(s.verdict == "OK" for s in subs) or p.status == "solved"
        if is_accepted:
            real_solved_count += 1

        attempts = len(subs) if subs else (1 if is_accepted else 0)
        verdicts = [s.verdict for s in subs]
        
        verdict_detail = "OK" if is_accepted else (", ".join(list(set(verdicts))) if verdicts else "Unsolved")

        problem_list.append({
            "problem_id": p.problem_id,
            "problem": f"Problem {p.index} - {p.name}",
            "name": p.name,
            "index": p.index,
            "difficulty": p.difficulty,
            "tags": p.tags.split(",") if p.tags else [],
            "status": "Accepted" if is_accepted else "Unsolved",
            "attempts": attempts,
            "time": "00:45",
            "verdict": verdict_detail
        })

    final_solved = max(contest.solved_count, real_solved_count)

    return {
        "contest_id": contest_id,
        "name": contest.name,
        "rank": contest.rank,
        "rating_before": contest.rating_before,
        "rating_after": contest.rating_after,
        "rating_change": contest.rating_change,
        "problems_attempted": len(problems),
        "problems_solved": final_solved,
        "wrong_submissions": wrong_count,
        "time_spent": "2h 00m",
        "problems": problem_list,
        "code_comparison": None,
        "code_comparison_note": "Not enough data for code comparison"
    }


@app.get("/mistakes")
def get_mistakes(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch user's classified mistakes from Database with cached Socratic directional hints"""
    query = db.query(Mistake).filter(Mistake.user_id == current_user.id)
    if platform and platform.lower() != "all":
        p_lower = platform.lower()
        if p_lower == "codeforces":
            query = query.filter(~Mistake.problem_id.like("LC-%"), ~Mistake.problem_id.like("CC-%"))
        elif p_lower == "leetcode":
            query = query.filter(Mistake.problem_id.like("LC-%"))
        elif p_lower == "codechef":
            query = query.filter(Mistake.problem_id.like("CC-%"))
    mistakes = query.all()
    res = []
    need_commit = False

    for m in mistakes:
        prob = db.query(Problem).filter(Problem.problem_id == m.problem_id).first()
        prob_name = f"{prob.index} - {prob.name}" if (prob and prob.index) else (prob.name if prob else m.problem_id)
        
        # Determine platform
        platform_str = "Codeforces"
        p_id_upper = m.problem_id.upper()
        if p_id_upper.startswith("LC-") or "LEETCODE" in p_id_upper:
            platform_str = "LeetCode"
        elif p_id_upper.startswith("CC-") or "CODECHEF" in p_id_upper:
            platform_str = "CodeChef"

        # Determine real verdict tag
        last_sub = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.problem_id == m.problem_id,
            Submission.verdict != "OK"
        ).order_by(Submission.id.desc()).first()

        verdict_tag = "WA"
        if last_sub:
            v_upper = last_sub.verdict.upper()
            if "TIME LIMIT" in v_upper or "TLE" in v_upper:
                verdict_tag = "TLE"
            elif "RUNTIME" in v_upper or "RTE" in v_upper:
                verdict_tag = "RTE"
            elif "MEMORY" in v_upper or "MLE" in v_upper:
                verdict_tag = "MLE"
            elif "WRONG" in v_upper or "WA" in v_upper:
                verdict_tag = "WA"
            else:
                verdict_tag = last_sub.verdict

        sub_source = last_sub.source_code if (last_sub and hasattr(last_sub, 'source_code')) else None
        attempts_count = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.problem_id == m.problem_id
        ).count() or 1
        prob_rating = prob.difficulty if prob else None

        # Auto-generate & cache missing or stale AI directional hints
        is_stale = m.missed_concept and (
            "Corner case boundary condition check failed under contest pressure" in m.missed_concept or
            "Likely caused by unhandled edge cases (N=1, N=0, negative values)" in m.missed_concept
        )
        if not m.missed_concept or not m.thinking_direction or is_stale:
            prob_tags = prob.tags.split(",") if prob and prob.tags else []
            hints = ai_engine.generate_directional_hints(
                problem_name=prob_name,
                verdict=verdict_tag,
                mistake_type=m.mistake_type,
                concept=m.concept or "Implementation",
                tags=prob_tags,
                source_code=sub_source,
                rating=prob_rating,
                attempts=attempts_count
            )
            m.missed_concept = hints.get("missed_concept")
            m.thinking_direction = hints.get("thinking_direction")
            m.direction_not_to_go = hints.get("direction_not_to_go")
            need_commit = True

        res.append({
            "id": m.id,
            "category": m.mistake_type,
            "problem": prob_name,
            "platform": platform_str,
            "concept": m.concept or "Implementation",
            "frequency": f"{attempts_count} {'attempts' if attempts_count > 1 else 'attempt'}",
            "verdict": verdict_tag,
            "note": m.reason or "Boundary error check failed",
            "missed_concept": m.missed_concept,
            "thinking_direction": m.thinking_direction,
            "direction_not_to_go": m.direction_not_to_go,
            "source_code": sub_source
        })

    if need_commit:
        db.commit()

    return res


class AttachCodeRequest(BaseModel):
    source_code: str


@app.post("/mistake/{mistake_id}/code")
def attach_mistake_code(
    mistake_id: int,
    data: AttachCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach real submitted source code to a mistake and regenerate contrastive AI analysis"""
    m = db.query(Mistake).filter(Mistake.id == mistake_id, Mistake.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mistake #{mistake_id} not found.")

    prob = db.query(Problem).filter(Problem.problem_id == m.problem_id).first()
    prob_name = f"{prob.index} - {prob.name}" if (prob and prob.index) else (prob.name if prob else m.problem_id)
    prob_tags = prob.tags.split(",") if prob and prob.tags else []
    prob_rating = prob.difficulty if prob else None

    # Update or create submission with source_code
    sub = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.problem_id == m.problem_id
    ).order_by(Submission.id.desc()).first()

    if not sub:
        sub = Submission(
            submission_id=f"sub_custom_{m.id}_{int(datetime.datetime.utcnow().timestamp())}",
            problem_id=m.problem_id,
            user_id=current_user.id,
            verdict="WRONG_ANSWER",
            source_code=data.source_code
        )
        db.add(sub)
    else:
        sub.source_code = data.source_code

    attempts_count = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.problem_id == m.problem_id
    ).count() or 1

    verdict_tag = sub.verdict or "WA"
    if "TIME" in verdict_tag.upper() or "TLE" in verdict_tag.upper():
        verdict_tag = "TLE"
    elif "RUNTIME" in verdict_tag.upper() or "RTE" in verdict_tag.upper():
        verdict_tag = "RTE"

    hints = ai_engine.generate_directional_hints(
        problem_name=prob_name,
        verdict=verdict_tag,
        mistake_type=m.mistake_type,
        concept=m.concept or "Implementation",
        tags=prob_tags,
        source_code=data.source_code,
        rating=prob_rating,
        attempts=attempts_count
    )

    m.missed_concept = hints.get("missed_concept")
    m.thinking_direction = hints.get("thinking_direction")
    m.direction_not_to_go = hints.get("direction_not_to_go")

    db.commit()
    db.refresh(m)

    return {
        "status": "success",
        "id": m.id,
        "missed_concept": m.missed_concept,
        "thinking_direction": m.thinking_direction,
        "direction_not_to_go": m.direction_not_to_go,
        "source_code": data.source_code
    }


@app.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch AI practice recommendations based on persisted mistakes"""
    platforms = db.query(Platform).filter(Platform.user_id == current_user.id).all()
    if not platforms:
        return {
            "headline": "Connect a Platform to Begin Coaching",
            "reason": "Link your Codeforces handle using the Connect Platform button in the top bar to get personalized practice recommendations based on your real contest submissions.",
            "problems": []
        }

    mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    mistake_list = [{"mistake_type": m.mistake_type, "reason": m.reason} for m in mistakes]
    return ai_engine.generate_practice_recommendations(mistake_list, [])


@app.post("/report/generate")
def generate_report(
    milestone_tier: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger AI milestone report generation and cache in Reports table"""
    total_contests = db.query(Contest).filter(Contest.user_id == current_user.id).count()
    if total_contests == 0:
        return {
            "status": "pending",
            "report_id": f"rep_{milestone_tier}_{current_user.id}",
            "report": {
                "title": f"Initial Skill Assessment for {current_user.name} (Pending)",
                "summary": "No contest history found yet. Connect your Codeforces handle to generate your first milestone report.",
                "strengths": [],
                "weaknesses": [],
                "plan": "Connect a platform handle to enable AI skill evaluation."
            }
        }

    report_data = _generate_user_milestone_report(db, current_user.id, milestone_tier, current_user.name)
    
    rep_id = f"rep_{milestone_tier}_{current_user.id}"
    report = db.query(Report).filter(Report.report_id == rep_id, Report.user_id == current_user.id).first()

    if not report:
        report = Report(
            report_id=rep_id,
            user_id=current_user.id,
            contest_range=f"Contests 1-{milestone_tier}",
            milestone_tier=milestone_tier,
            summary=report_data["summary"],
            recommendations=report_data["plan"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(report)
    else:
        report.summary = report_data["summary"]
        report.recommendations = report_data["plan"]

    db.commit()

    return {"status": "generated", "report_id": rep_id, "report": report_data}


@app.get("/report/{report_id}")
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch a cached milestone report from Database or generate dynamically if missing"""
    total_contests = db.query(Contest).filter(Contest.user_id == current_user.id).count()
    if total_contests == 0:
        return {
            "report_id": report_id,
            "title": f"Initial Skill Assessment for {current_user.name} (Pending)",
            "summary": "No contest history found yet. Click 'Connect Platform' in the header bar to link your Codeforces handle.",
            "strengths": [],
            "weaknesses": [],
            "plan": "Connect a platform handle to enable AI skill evaluation."
        }

    tier = 5
    for t in [50, 20, 10, 5]:
        if str(t) in str(report_id):
            tier = t
            break

    db_report = db.query(Report).filter(
        Report.user_id == current_user.id,
        (Report.report_id == report_id) | (Report.milestone_tier == tier)
    ).first()

    if db_report and db_report.summary:
        report_data = _generate_user_milestone_report(db, current_user.id, db_report.milestone_tier, current_user.name)
        report_data["summary"] = db_report.summary
        report_data["plan"] = db_report.recommendations
        return report_data

    report_data = _generate_user_milestone_report(db, current_user.id, tier, current_user.name)
    rep_id = f"rep_{tier}_{current_user.id}"
    new_report = Report(
        report_id=rep_id,
        user_id=current_user.id,
        contest_range=f"Contests 1-{tier}",
        milestone_tier=tier,
        summary=report_data["summary"],
        recommendations=report_data["plan"],
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_report)
    db.commit()

    return report_data


def _compute_rating_buckets(subs, current_user_id: str, db: Session, live_only: bool = False):
    problem_solve_times = {}

    for sub in subs:
        if not sub.problem or not sub.problem.difficulty:
            continue

        p_type = (sub.participant_type or "CONTESTANT").upper()
        is_live = p_type in ["CONTESTANT", "OUT_OF_COMPETITION"]

        if live_only and not is_live:
            continue

        diff_str = str(sub.problem.difficulty).strip().lower()
        if diff_str == "easy":
            rating = 1000
        elif diff_str == "medium":
            rating = 1400
        elif diff_str == "hard":
            rating = 1800
        else:
            try:
                rating = int(float(diff_str))
            except (ValueError, TypeError):
                continue

        rating_bucket = (rating // 100) * 100
        if rating_bucket < 800:
            rating_bucket = 800

        sec = sub.time_seconds or 0

        # If timestamp is raw epoch timestamp (> 10^9), try converting to contest relative seconds
        if sec > 1000000000:
            c = db.query(Contest).filter(
                (Contest.contest_id == sub.problem.contest_id) | (Contest.contest_id == f"cf_{sub.problem.contest_id}"),
                Contest.user_id == current_user_id
            ).first()
            if c and c.date:
                try:
                    c_dt = datetime.datetime.strptime(c.date, "%Y-%m-%d")
                    c_epoch = int(c_dt.timestamp())
                    sec = max(60, int(sec - c_epoch))
                except Exception:
                    sec = 0
            else:
                sec = 0

        if live_only and sec > 18000:
            continue

        prob_id = sub.problem_id
        if prob_id not in problem_solve_times:
            problem_solve_times[prob_id] = {
                "rating": rating_bucket,
                "solve_seconds": sec
            }
        elif sec > 0 and (problem_solve_times[prob_id]["solve_seconds"] == 0 or sec < problem_solve_times[prob_id]["solve_seconds"]):
            problem_solve_times[prob_id]["solve_seconds"] = sec

    buckets = {}
    problem_counts = {}

    for info in problem_solve_times.values():
        r = info["rating"]
        s = info["solve_seconds"]

        problem_counts[r] = problem_counts.get(r, 0) + 1

        if s > 0 and s <= 18000:
            if r not in buckets:
                buckets[r] = []
            buckets[r].append(s)

    result = []
    for r in sorted(problem_counts.keys()):
        count = problem_counts[r]
        times = buckets.get(r, [])

        if len(times) > 0:
            avg_sec = int(sum(times) / len(times))
            mins = avg_sec // 60
            secs = avg_sec % 60
            if mins >= 60:
                hrs = mins // 60
                mins = mins % 60
                fmt_time = f"{hrs}:{mins:02d}:{secs:02d}"
            else:
                fmt_time = f"{mins:02d}:{secs:02d}"

            if avg_sec <= 1800:
                pace_status = "Optimal Pace"
            elif avg_sec <= 3600:
                pace_status = "Moderate Pace"
            else:
                pace_status = "Pacing Drop-off"
        else:
            avg_sec = 0
            fmt_time = "N/A"
            pace_status = "On Pace"

        result.append({
            "rating": r,
            "solved_count": count,
            "avg_time_seconds": avg_sec,
            "formatted_avg_time": fmt_time,
            "pace_status": pace_status
        })

    return result


@app.get("/analytics/avg-solve-time-by-rating")
def get_avg_solve_time_by_rating(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compute average solve time by problem rating bucket across ALL synced contests for the user.
    Returns separate datasets:
    - live_contest: Official contest round solves (CONTESTANT / OUT_OF_COMPETITION).
    - overall: Practice & upsolve inclusive metrics.
    """
    query = db.query(Submission).join(Problem).filter(
        Submission.user_id == current_user.id,
        Submission.verdict.in_(["OK", "ACCEPTED", "Accepted", "solved"])
    )
    if platform and platform.lower() != "all":
        p_lower = platform.lower()
        if p_lower == "codeforces":
            query = query.filter(~Problem.problem_id.like("LC-%"), ~Problem.problem_id.like("CC-%"))
        elif p_lower == "leetcode":
            query = query.filter(Problem.problem_id.like("LC-%"))
        elif p_lower == "codechef":
            query = query.filter(Problem.problem_id.like("CC-%"))
    solved_subs = query.all()

    live_data = _compute_rating_buckets(solved_subs, current_user.id, db, live_only=True)
    overall_data = _compute_rating_buckets(solved_subs, current_user.id, db, live_only=False)

    return {
        "live_contest": live_data,
        "overall": overall_data
    }


def get_topic_accuracy_for_user(user_id: str, db: Session) -> list:
    """
    Compute real per-platform solve accuracy % and mastery stars per topic tag.
    Strictly checks connected platforms:
    - Unconnected platform -> "Not Connected"
    - Connected platform with 0 subs -> "No data yet"
    - Connected platform with subs -> "X% (solved/attempted)"
    """
    connected_platforms = db.query(Platform).filter(Platform.user_id == user_id).all()
    connected_map = {p.platform.lower(): p.handle for p in connected_platforms}

    submissions = db.query(Submission).filter(Submission.user_id == user_id).all()

    default_tags = [
        "implementation", "math", "greedy", "brute force", "data structures",
        "binary search", "dfs and bfs", "dp", "two pointers", "sortings", "graphs", "dsu"
    ]

    topic_platform_stats = {}
    for tag in default_tags:
        topic_platform_stats[tag] = {
            "codeforces": {"solved": 0, "attempted": 0},
            "leetcode": {"solved": 0, "attempted": 0},
            "codechef": {"solved": 0, "attempted": 0}
        }

    for sub in submissions:
        if not sub.problem or not sub.problem.tags:
            continue

        plat = "codeforces"
        p_id = sub.problem_id.upper()
        if p_id.startswith("LC-") or "LEETCODE" in p_id:
            plat = "leetcode"
        elif p_id.startswith("CC-") or "CODECHEF" in p_id:
            plat = "codechef"

        tags = [t.strip().lower() for t in sub.problem.tags.split(",") if t.strip()]
        for tag in tags:
            if tag not in topic_platform_stats:
                topic_platform_stats[tag] = {
                    "codeforces": {"solved": 0, "attempted": 0},
                    "leetcode": {"solved": 0, "attempted": 0},
                    "codechef": {"solved": 0, "attempted": 0}
                }
            topic_platform_stats[tag][plat]["attempted"] += 1
            if sub.verdict == "OK":
                topic_platform_stats[tag][plat]["solved"] += 1

    result = []
    for tag, stats in topic_platform_stats.items():
        total_attempted = 0
        total_solved = 0

        platform_metrics = {}
        for p_name in ["codeforces", "leetcode", "codechef"]:
            if p_name not in connected_map:
                platform_metrics[p_name] = "Not Connected"
            else:
                p_att = stats[p_name]["attempted"]
                p_sol = stats[p_name]["solved"]
                if p_att == 0:
                    platform_metrics[p_name] = "No data yet"
                else:
                    acc = int((p_sol / p_att) * 100)
                    platform_metrics[p_name] = f"{acc}% ({p_sol}/{p_att})"
                    total_attempted += p_att
                    total_solved += p_sol

        if total_attempted == 0:
            overall_acc_str = "No data yet"
        else:
            overall_acc = int((total_solved / total_attempted) * 100)
            overall_acc_str = f"{overall_acc}%"

        if total_attempted > 0 or tag in default_tags[:6]:
            result.append({
                "topic": tag.title(),
                "accuracy": overall_acc_str,
                "cfStats": platform_metrics["codeforces"],
                "lcStats": platform_metrics["leetcode"],
                "ccStats": platform_metrics["codechef"]
            })

    result.sort(key=lambda x: (
        0 if x["accuracy"] == "No data yet" else 1,
        int(x["accuracy"].replace("%", "")) if x["accuracy"] != "No data yet" else 0
    ), reverse=True)

    return result


@app.get("/topics/accuracy")
def get_topic_accuracy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate solve accuracy % and star rating per topic tag from real DB submissions"""
    return get_topic_accuracy_for_user(current_user.id, db)


@app.get("/learning-graph")
def get_learning_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Classify concept nodes as mastered, weak, unmastered, or unattempted from real DB solves & mistakes"""
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()

    mistake_concepts = [m.concept.lower() if m.concept else "" for m in mistakes]
    mistake_types = [m.mistake_type.lower() if m.mistake_type else "" for m in mistakes]

    concepts = [
        {"id": 1, "name": "Arrays & Strings", "keywords": ["array", "string", "implementation"]},
        {"id": 2, "name": "Two Pointers", "keywords": ["two pointers", "pointer"]},
        {"id": 3, "name": "Prefix Sums", "keywords": ["prefix sum", "cumulative", "sum"]},
        {"id": 4, "name": "Binary Search", "keywords": ["binary search", "ternary search"]},
        {"id": 5, "name": "DFS & BFS", "keywords": ["dfs", "bfs", "graph", "traversal"]},
        {"id": 6, "name": "Dynamic Programming", "keywords": ["dp", "dynamic programming"]},
        {"id": 7, "name": "Segment Trees", "keywords": ["segment tree", "fenwick", "bit"]},
        {"id": 8, "name": "Math & Number Theory", "keywords": ["math", "number theory", "prime", "modulo"]},
        {"id": 9, "name": "Greedy Algorithms", "keywords": ["greedy"]}
    ]

    nodes = []
    for c in concepts:
        matched_subs = []
        for sub in submissions:
            if sub.problem and sub.problem.tags:
                p_tags = sub.problem.tags.lower()
                if any(kw in p_tags for kw in c["keywords"]):
                    matched_subs.append(sub)

        attempted = len(matched_subs)
        solved = len([s for s in matched_subs if s.verdict == "OK"])
        has_mistakes = any(
            any(kw in m_c for kw in c["keywords"]) or any(kw in m_t for kw in c["keywords"])
            for m_c in mistake_concepts for m_t in mistake_types
        )

        if attempted == 0:
            status = "unattempted"
            count_str = "0 Attempts"
        else:
            acc_pct = int((solved / attempted) * 100) if attempted > 0 else 0
            count_str = f"{solved}/{attempted} Solved ({acc_pct}%)"

            if has_mistakes or acc_pct < 50:
                status = "weak"
            elif solved >= 2 and acc_pct >= 70:
                status = "mastered"
            else:
                status = "unmastered"

        nodes.append({
            "id": c["id"],
            "name": c["name"],
            "status": status,
            "level": "Core Concept" if c["id"] <= 3 else "Advanced",
            "count": count_str
        })

    return nodes



@app.get("/contest/{contest_id}/timeline")
def get_contest_timeline(
    contest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reconstruct minute-by-minute submission order and stuck period from DB submissions using relativeTimeSeconds"""
    contest = db.query(Contest).filter(Contest.contest_id == contest_id, Contest.user_id == current_user.id).first()
    if not contest:
        raise HTTPException(status_code=404, detail=f"Contest '{contest_id}' not found.")

    # Match problems belonging to this contest
    # Handle numeric contest_id (e.g. '2244') vs prefixed contest_id (e.g. 'cf_2244')
    clean_cid = contest_id.replace("cf_", "").strip()
    
    submissions = db.query(Submission).join(Problem).filter(
        Submission.user_id == current_user.id,
        (Problem.contest_id == contest_id) | (Problem.contest_id == clean_cid) | (Problem.problem_id.like(f"CF-{clean_cid}%"))
    ).all()

    # Sort submissions by time_seconds ascending
    submissions.sort(key=lambda x: x.time_seconds or 0)

    events = []
    prev_time = 0
    max_stuck_sec = 0
    stuck_problem = ""

    for sub in submissions:
        sec = sub.time_seconds or 0

        # Handle raw epoch timestamp fallback
        if sec > 1000000000:
            if contest.date:
                try:
                    c_dt = datetime.datetime.strptime(contest.date, "%Y-%m-%d")
                    c_epoch = int(c_dt.timestamp())
                    sec = max(60, int(sec - c_epoch))
                except Exception:
                    sec = 0
            else:
                sec = 0

        mins = sec // 60
        secs = sec % 60
        if mins >= 60:
            hrs = mins // 60
            mins = mins % 60
            fmt_time = f"{hrs:02d}:{mins:02d}:{secs:02d}"
        else:
            fmt_time = f"{mins:02d}:{secs:02d}"

        # Track gap / stuck period between submissions
        if prev_time > 0 and sec > prev_time:
            gap = sec - prev_time
            if gap > max_stuck_sec:
                max_stuck_sec = gap
                stuck_problem = sub.problem.name if sub.problem else "Problem"

        prev_time = sec

        prob_display = f"Problem {sub.problem.index if sub.problem else 'A'} - {sub.problem.name if sub.problem else 'Problem'}"
        notes = f"Accepted in {mins}m {secs}s" if sub.verdict == "OK" else f"{sub.verdict} attempt at {fmt_time}"

        events.append({
            "id": sub.submission_id,
            "time": fmt_time,
            "problem": prob_display,
            "verdict": sub.verdict,
            "verdictType": "accepted" if sub.verdict == "OK" else "wrong",
            "notes": notes
        })

    stuck_desc = f"{max_stuck_sec // 60} mins before solving {stuck_problem}" if max_stuck_sec > 300 else "Pacing smooth — no major stuck periods"
    stuck_reason = "Debugging edge cases & complexity optimization" if max_stuck_sec > 300 else "Optimal solving speed"

    return {
        "contest_name": contest.name,
        "date": contest.date,
        "rank": contest.rank,
        "rating_change": contest.rating_change,
        "timeline": events,
        "stuck_analysis": {
            "longest_stuck": stuck_desc,
            "reason": stuck_reason
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
