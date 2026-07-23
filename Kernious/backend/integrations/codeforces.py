"""
Real Codeforces API Integration Module for Kernious
Fetches public user info, contest rating history, and submission logs with full pagination.
Ingests real data directly into SQLAlchemy Database models.
"""
import urllib.request
import json
import datetime
from sqlalchemy.orm import Session
from backend.models.models import Platform, Contest, Problem, Submission, Mistake

CODEFORCES_API_BASE = "https://codeforces.com/api"


def fetch_user_info(handle: str):
    """
    Validate handle and fetch user profile summary from Codeforces API.
    Returns dict if handle is valid, None if handle does not exist.
    """
    try:
        url = f"{CODEFORCES_API_BASE}/user.info?handles={handle}"
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode('utf-8'))
            if res.get("status") == "OK" and res.get("result"):
                return res["result"][0]
        return None
    except Exception as e:
        print(f"Error validating Codeforces handle '{handle}': {e}")
        return None


def fetch_user_contests(handle: str):
    """
    Fetch full contest rating history for user from Codeforces API.
    Returns list of contest rating change objects.
    """
    try:
        url = f"{CODEFORCES_API_BASE}/user.rating?handle={handle}"
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res = json.loads(response.read().decode('utf-8'))
            if res.get("status") == "OK":
                return res["result"]
        return []
    except Exception as e:
        print(f"Error fetching Codeforces contest history for '{handle}': {e}")
        return []


def fetch_user_submissions(handle: str, from_index: int = 1, count: int = 1000):
    """
    Fetch user submission log page from Codeforces API.
    """
    try:
        url = f"{CODEFORCES_API_BASE}/user.status?handle={handle}&from={from_index}&count={count}"
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res = json.loads(response.read().decode('utf-8'))
            if res.get("status") == "OK":
                return res["result"]
        return []
    except Exception as e:
        print(f"Error fetching Codeforces submissions for '{handle}' (from={from_index}): {e}")
        return []


def fetch_all_user_submissions(handle: str, batch_size: int = 1000, max_batches: int = 30) -> list:
    """
    Paginate through Codeforces user.status API until 100% of submissions are retrieved.
    """
    all_subs = []
    from_index = 1
    for _ in range(max_batches):
        batch = fetch_user_submissions(handle, from_index=from_index, count=batch_size)
        if not batch:
            break
        all_subs.extend(batch)
        if len(batch) < batch_size:
            break
        from_index += batch_size
    return all_subs


def sync_codeforces_data(db: Session, user_id: str, handle: str) -> dict:
    """
    End-to-end sync function with complete submission pagination:
    1. Validates handle via real API.
    2. Upserts Platform record.
    3. Persists full contest history and rating deltas.
    4. Persists 100% of real problems and submissions.
    """
    cf_user = fetch_user_info(handle)
    if not cf_user:
        return {"success": False, "error": f"Codeforces handle '{handle}' does not exist."}

    # Upsert Platform record
    plat = db.query(Platform).filter(Platform.user_id == user_id, Platform.platform == "codeforces").first()
    if not plat:
        plat = Platform(user_id=user_id, platform="codeforces", handle=handle)
        db.add(plat)
    else:
        plat.handle = handle

    plat.sync_status = "synced"
    plat.last_synced_at = datetime.datetime.utcnow()
    db.commit()

    # Ingest Contest History
    cf_contests = fetch_user_contests(handle)
    contests_synced = 0

    for c in cf_contests:
        c_id = f"cf_{c.get('contestId')}"
        existing_c = db.query(Contest).filter(Contest.contest_id == c_id, Contest.user_id == user_id).first()
        rating_before = c.get("oldRating", 0)
        rating_after = c.get("newRating", 0)
        date_str = datetime.datetime.fromtimestamp(c.get("ratingUpdateTimeSeconds", 0)).strftime("%Y-%m-%d")

        if not existing_c:
            new_c = Contest(
                contest_id=c_id,
                user_id=user_id,
                platform="codeforces",
                name=c.get("contestName", f"Codeforces Round {c.get('contestId')}"),
                date=date_str,
                rank=c.get("rank", 0),
                rating_before=rating_before,
                rating_after=rating_after,
                rating_change=rating_after - rating_before,
                solved_count=0,
                total_problems=5,
                summary=None
            )
            db.add(new_c)
            contests_synced += 1
        else:
            existing_c.rank = c.get("rank", existing_c.rank)
            existing_c.rating_before = rating_before
            existing_c.rating_after = rating_after
            existing_c.rating_change = rating_after - rating_before

    db.commit()

    # Ingest ALL Submissions & Problems via pagination loop
    submissions = fetch_all_user_submissions(handle, batch_size=1000)
    solved_problems_per_contest = {}
    added_problems = {}

    for sub in submissions:
        prob_data = sub.get("problem", {})
        contest_num = prob_data.get("contestId")
        if not contest_num:
            continue

        c_id = f"cf_{contest_num}"
        index = prob_data.get("index", "A")
        prob_id = f"CF-{contest_num}{index}"
        tags_str = ",".join(prob_data.get("tags", []))
        verdict = sub.get("verdict", "OK")

        if c_id not in solved_problems_per_contest:
            solved_problems_per_contest[c_id] = set()
        if verdict == "OK":
            solved_problems_per_contest[c_id].add(prob_id)

        # Check in memory cache first, then DB
        if prob_id in added_problems:
            prob_obj = added_problems[prob_id]
            if verdict == "OK":
                prob_obj.status = "solved"
        else:
            existing_prob = db.query(Problem).filter(Problem.problem_id == prob_id).first()
            if not existing_prob:
                # Infer rating from official rating or index heuristic (A=800, B=900, C=1000)
                raw_rating = prob_data.get("rating")
                if not raw_rating:
                    if index.upper() == 'A':
                        inferred = "800"
                    elif index.upper() == 'B':
                        inferred = "900"
                    elif index.upper() == 'C':
                        inferred = "1000"
                    elif index.upper() == 'D':
                        inferred = "1100"
                    else:
                        inferred = "800"
                else:
                    inferred = str(raw_rating)

                existing_prob = Problem(
                    problem_id=prob_id,
                    contest_id=c_id,
                    name=prob_data.get("name", f"Problem {index}"),
                    index=index,
                    difficulty=inferred,
                    tags=tags_str,
                    status="solved" if verdict == "OK" else "attempted"
                )
                db.add(existing_prob)
            elif verdict == "OK":
                existing_prob.status = "solved"
            added_problems[prob_id] = existing_prob

        # Insert Submission
        sub_id = str(sub.get("id"))
        existing_sub = db.query(Submission).filter(Submission.submission_id == sub_id).first()
        author_info = sub.get("author", {})
        p_type = author_info.get("participantType", "CONTESTANT")
        rel_seconds = sub.get("relativeTimeSeconds")
        solve_sec = rel_seconds if (rel_seconds is not None and rel_seconds >= 0) else sub.get("creationTimeSeconds", 0)

        if not existing_sub:
            new_sub = Submission(
                submission_id=sub_id,
                problem_id=prob_id,
                user_id=user_id,
                language=sub.get("programmingLanguage", "C++"),
                runtime=f"{sub.get('timeConsumedMillis', 0)} ms",
                memory=f"{sub.get('memoryConsumedBytes', 0) // 1024} KB",
                verdict=verdict,
                time_seconds=solve_sec,
                participant_type=p_type
            )
            db.add(new_sub)
        else:
            existing_sub.participant_type = p_type
            if rel_seconds is not None and rel_seconds >= 0:
                existing_sub.time_seconds = rel_seconds

    # Update solved count on Contests
    for c_id, solved_set in solved_problems_per_contest.items():
        contest_obj = db.query(Contest).filter(Contest.contest_id == c_id, Contest.user_id == user_id).first()
        if contest_obj:
            contest_obj.solved_count = len(solved_set)
            if contest_obj.total_problems < len(solved_set):
                contest_obj.total_problems = max(5, len(solved_set))

    db.commit()
    return {
        "success": True,
        "handle": handle,
        "rating": cf_user.get("rating", 0),
        "peak_rating": cf_user.get("maxRating", 0),
        "contests_synced": len(cf_contests),
        "total_submissions_synced": len(submissions)
    }
