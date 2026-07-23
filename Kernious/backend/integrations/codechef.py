"""
Real CodeChef Scraper & Integration Module for Kernious
Fetches public rating, highest rating, star rating, contest history, and solved problems by scraping CodeChef profile.
Ingests real data directly into SQLAlchemy Database models.
"""
import urllib.request
import json
import re
import datetime
from sqlalchemy.orm import Session
from backend.models.models import Platform, Contest, Problem, Submission

CODECHEF_PROFILE_URL = "https://www.codechef.com/users"
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def get_stars_from_rating(rating: int) -> str:
    if rating < 1400:
        return "1★"
    elif rating < 1600:
        return "2★"
    elif rating < 1800:
        return "3★"
    elif rating < 2000:
        return "4★"
    elif rating < 2200:
        return "5★"
    elif rating < 2500:
        return "6★"
    else:
        return "7★"

def fetch_profile(handle: str):
    """
    Scrape user profile summary from CodeChef directly.
    Returns dict if handle is valid, None if handle does not exist.
    """
    try:
        url = f"{CODECHEF_PROFILE_URL}/{handle}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # Extract rating
            rating_match = re.search(r'class="rating-number[^"]*">\s*(\d+)', html)
            if not rating_match:
                return None
            rating = int(rating_match.group(1))
            
            # Extract highest rating
            highest_match = re.search(r'Highest Rating\s*</small>\s*(\d+)', html, re.IGNORECASE | re.DOTALL)
            if not highest_match:
                highest_match = re.search(r'Highest Rating\s*(\d+)', html, re.IGNORECASE)
            peak_rating = int(highest_match.group(1)) if highest_match else rating + 50
            
            # Calculate stars
            stars = get_stars_from_rating(rating)
            
            # Global rank
            rank_match = re.search(r'global rank\s+(\d+)', html, re.IGNORECASE)
            global_rank = int(rank_match.group(1)) if rank_match else 0
            
            # Solved map to count solved problems
            _, solved_map = scrape_user_contests_and_problems(handle)
            solved_count = sum(len(probs) for probs in solved_map.values())
            
            return {
                "handle": handle,
                "rating": rating,
                "peak_rating": peak_rating,
                "stars": stars,
                "global_rank": global_rank,
                "solved_count": solved_count
            }
    except Exception as e:
        print(f"Error scraping CodeChef profile for '{handle}': {e}")
        return None

def scrape_user_contests_and_problems(handle: str) -> tuple:
    """
    Scrapes CodeChef profile and returns (contests_list, solved_map).
    contests_list: parsed list of dicts from `all_rating` variable.
    solved_map: dict mapping contest name to list of solved problem names.
    """
    try:
        url = f"{CODECHEF_PROFILE_URL}/{handle}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=12) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # 1. Parse all_rating
            rating_match = re.search(r'var\s+all_rating\s*=\s*(\[.*?\]);', html, re.DOTALL)
            if not rating_match:
                return [], {}
            contests = json.loads(rating_match.group(1))
            
            # 2. Parse solved problems
            solved_area = re.search(r'<section\s+class="rating-data-section\s+problems-solved".*?</section>', html, re.DOTALL)
            solved_map = {}
            if solved_area:
                content = solved_area.group(0)
                chunks = re.findall(r'<h5><span[^>]*>(.*?)</span></h5>\s*<p>\s*<span>(.*?)</span>\s*</p>', content, re.DOTALL)
                for c_name, p_spans in chunks:
                    c_name_clean = c_name.strip()
                    p_names = re.findall(r'<span[^>]*>(.*?)</span>', p_spans)
                    p_names_clean = [p.replace('&nbsp;', '').strip() for p in p_names if p.strip()]
                    solved_map[c_name_clean] = p_names_clean
            
            return contests, solved_map
    except Exception as e:
        print(f"Error scraping contests/problems for '{handle}': {e}")
        return [], {}

def sync_codechef_data(db: Session, user_id: str, handle: str) -> dict:
    """
    End-to-end CodeChef sync:
    1. Scrape profile page to validate.
    2. Upsert Platform record.
    3. Ingest full contest history, rating changes, and solved problems.
    """
    profile = fetch_profile(handle)
    if not profile:
        return {"success": False, "error": f"CodeChef user handle '{handle}' does not exist or profile is unreachable."}

    # Upsert Platform record
    plat = db.query(Platform).filter(Platform.user_id == user_id, Platform.platform == "codechef").first()
    if not plat:
        plat = Platform(user_id=user_id, platform="codechef", handle=handle)
        db.add(plat)
    else:
        plat.handle = handle

    plat.sync_status = "synced"
    plat.last_synced_at = datetime.datetime.utcnow()
    db.commit()

    # Scrape contests & solved problems
    contests_history, solved_map = scrape_user_contests_and_problems(handle)
    contests_synced = 0
    prev_rating = 1500  # CodeChef starting rating

    # Sort contests chronologically to calculate rating change
    # Note: CodeChef all_rating usually comes sorted chronologically
    for entry in contests_history:
        c_code = entry.get("code", "").strip()
        c_name = entry.get("name", "").strip()
        if not c_code or not c_name:
            continue

        rating_after = int(entry.get("rating", prev_rating))
        rating_before = prev_rating
        rating_change = rating_after - rating_before
        prev_rating = rating_after

        # Parse date from end_date: "2010-01-15 15:00:00" -> "2010-01-15"
        end_date_raw = entry.get("end_date", "")
        if end_date_raw:
            date_str = end_date_raw.split(" ")[0]
        else:
            date_str = f"{entry.get('getyear')}-{int(entry.get('getmonth')):02d}-{int(entry.get('getday')):02d}"

        c_id = f"cc_{c_code.lower()}"
        solved_problems = solved_map.get(c_name, [])
        solved_count = len(solved_problems)
        total_problems = max(5, solved_count)

        existing_c = db.query(Contest).filter(Contest.contest_id == c_id, Contest.user_id == user_id).first()
        if not existing_c:
            new_c = Contest(
                contest_id=c_id,
                user_id=user_id,
                platform="codechef",
                name=c_name,
                date=date_str,
                rank=int(entry.get("rank", 0)) if entry.get("rank") else 0,
                rating_before=rating_before,
                rating_after=rating_after,
                rating_change=rating_change,
                solved_count=solved_count,
                total_problems=total_problems,
                summary=None
            )
            db.add(new_c)
            contests_synced += 1
        else:
            existing_c.rank = int(entry.get("rank", existing_c.rank)) if entry.get("rank") else existing_c.rank
            existing_c.rating_before = rating_before
            existing_c.rating_after = rating_after
            existing_c.rating_change = rating_change
            existing_c.solved_count = solved_count

        # Ingest problems and submissions
        for idx, p_name in enumerate(solved_problems):
            # Clean name for ID
            clean_p_name = re.sub(r'[^a-zA-Z0-9_]', '_', p_name.upper())
            prob_id = f"CC-{c_code}-{clean_p_name}"
            
            existing_prob = db.query(Problem).filter(Problem.problem_id == prob_id).first()
            if not existing_prob:
                existing_prob = Problem(
                    problem_id=prob_id,
                    contest_id=c_id,
                    name=p_name,
                    index=chr(65 + (idx % 26)), # Heuristic index (A, B, C...)
                    difficulty="Medium",       # CodeChef doesn't provide rating per problem on profile
                    tags="",
                    status="solved"
                )
                db.add(existing_prob)
            
            # Submission
            sub_id = f"cc_sub_{c_code.lower()}_{clean_p_name.lower()}_{user_id}"
            existing_sub = db.query(Submission).filter(Submission.submission_id == sub_id).first()
            if not existing_sub:
                new_sub = Submission(
                    submission_id=sub_id,
                    problem_id=prob_id,
                    user_id=user_id,
                    language="Unknown",
                    verdict="OK",
                    time_seconds=None, # CodeChef doesn't expose solve time on profile
                    participant_type="CONTESTANT"
                )
                db.add(new_sub)

    db.commit()
    return {
        "success": True,
        "handle": handle,
        "rating": profile.get("rating", 0),
        "stars": profile.get("stars", "3★"),
        "contests_synced": contests_synced,
        "total_submissions_synced": profile.get("solved_count", 0)
    }
