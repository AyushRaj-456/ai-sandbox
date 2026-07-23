"""
Real LeetCode GraphQL API Integration Module for Kernious
Fetches public user contest history, rating, and profile stats via LeetCode's
unofficial GraphQL endpoint (https://leetcode.com/graphql).

HONEST DATA CAVEAT:
- Full submission history (per-problem verdicts across all past contests) requires
  a LEETCODE_SESSION cookie. Without it, only aggregate per-contest data is available.
- Per-problem solve time within a contest is NOT exposed by LeetCode's API at all.
  We store time_seconds=None and label it honestly in summaries.
- We DO get: contest rank, rating change, solved count, total problems per contest.
"""
import urllib.request
import json
import datetime
from sqlalchemy.orm import Session
from backend.models.models import Platform, Contest, Problem, Submission

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
LEETCODE_GRAPHQL_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://leetcode.com',
    'Origin': 'https://leetcode.com'
}


def _graphql(query: str, variables: dict) -> dict:
    """Execute a LeetCode GraphQL query. Returns the data dict or {}."""
    try:
        payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
        req = urllib.request.Request(LEETCODE_GRAPHQL_URL, data=payload, headers=LEETCODE_GRAPHQL_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8")).get("data", {})
    except Exception as e:
        print(f"[LeetCode GraphQL] Error: {e}")
        return {}


def fetch_profile(handle: str):
    """
    Validate a LeetCode username and fetch profile summary.
    Returns dict if handle is valid, None if handle does not exist.
    """
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        attendedContestsCount
      }
    }
    """
    data = _graphql(query, {"username": handle})
    matched = data.get("matchedUser")
    if not matched:
        return None

    contest_data = data.get("userContestRanking") or {}
    rating = int(round(contest_data.get("rating") or 0))

    solved_by_diff = {"Easy": 0, "Medium": 0, "Hard": 0, "All": 0}
    for item in matched.get("submitStats", {}).get("acSubmissionNum", []):
        solved_by_diff[item.get("difficulty", "All")] = item.get("count", 0)

    return {
        "handle": handle,
        "rating": rating,
        "solved_count": solved_by_diff.get("All", 0),
        "solved_easy": solved_by_diff.get("Easy", 0),
        "solved_medium": solved_by_diff.get("Medium", 0),
        "solved_hard": solved_by_diff.get("Hard", 0),
        "contests_attended": contest_data.get("attendedContestsCount", 0),
        "global_ranking": contest_data.get("globalRanking", 0)
    }


def fetch_contest_history(handle: str) -> list:
    """
    Fetch full career contest history for a LeetCode user.
    Returns list of attended contest dicts with rank, rating, solved count.

    Data available per contest from userContestRankingHistory:
    - attended (bool)
    - rating (float) — rating AFTER this contest
    - ranking (int)  — rank in this specific contest
    - trendDirection — "UP" | "DOWN" | ""
    - contest.title
    - contest.startTime (Unix epoch)
    - problemsSolved (int)  — problems solved in this contest
    - totalProblems (int)   — total problems in this contest
    - finishTimeInSeconds (int) — time user finished (relative to contest start)

    NOTE: Per-problem breakdown requires additional queries per contest slug
    which would be extremely slow for users with 100+ contests.
    """
    query = """
    query userContestRankingInfo($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        trendDirection
        rating
        ranking
        problemsSolved
        totalProblems
        finishTimeInSeconds
        contest {
          title
          startTime
        }
      }
    }
    """
    data = _graphql(query, {"username": handle})
    history = data.get("userContestRankingHistory") or []
    return [h for h in history if h.get("attended")]


def sync_leetcode_data(db: Session, user_id: str, handle: str) -> dict:
    """
    End-to-end LeetCode sync:
    1. Validates handle via GraphQL profile query.
    2. Upserts Platform record.
    3. Persists full contest history into shared Contest table (platform='leetcode').
    4. Creates problem placeholder stubs for solved problems per contest.

    What we CAN populate (no session cookie required):
    - Contest name, date, rank, rating_before, rating_after, rating_change
    - Solved count and total problems per contest
    - User's overall rating and global ranking

    What is HONEST NOT AVAILABLE without session cookie:
    - Per-problem submission verdicts for past contests
    - Exact per-problem solve times (LeetCode has NO relativeTimeSeconds equivalent)
    - Full submission history beyond the last 20 accepted submissions
    """
    profile = fetch_profile(handle)
    if not profile:
        return {"success": False, "error": f"LeetCode username '{handle}' does not exist."}

    # Upsert Platform record
    plat = db.query(Platform).filter(Platform.user_id == user_id, Platform.platform == "leetcode").first()
    if not plat:
        plat = Platform(user_id=user_id, platform="leetcode", handle=handle)
        db.add(plat)
    else:
        plat.handle = handle
    plat.sync_status = "synced"
    plat.last_synced_at = datetime.datetime.utcnow()
    db.commit()

    history = fetch_contest_history(handle)
    contests_synced = 0
    prev_rating = 1500  # LeetCode starting rating

    # Process oldest → newest to compute rating deltas
    for entry in history:
        rating_after = int(round(entry.get("rating") or prev_rating))
        rating_before = prev_rating
        rating_change = rating_after - rating_before
        prev_rating = rating_after

        start_ts = (entry.get("contest") or {}).get("startTime") or 0
        date_str = datetime.datetime.utcfromtimestamp(start_ts).strftime("%Y-%m-%d") if start_ts else "2024-01-01"

        contest_title = (entry.get("contest") or {}).get("title", "LeetCode Contest")
        # Build a stable slug-based ID: "lc_weekly-contest-397"
        slug = contest_title.lower().replace(" ", "-").replace("_", "-")
        c_id = f"lc_{slug}"

        solved_count = entry.get("problemsSolved") or 0
        total_problems = entry.get("totalProblems") or 4  # LC contests are 4 problems

        existing_c = db.query(Contest).filter(Contest.contest_id == c_id, Contest.user_id == user_id).first()
        if not existing_c:
            new_c = Contest(
                contest_id=c_id,
                user_id=user_id,
                platform="leetcode",
                name=contest_title,
                date=date_str,
                rank=entry.get("ranking") or 0,
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
            existing_c.rank = entry.get("ranking") or existing_c.rank
            existing_c.rating_before = rating_before
            existing_c.rating_after = rating_after
            existing_c.rating_change = rating_change
            existing_c.solved_count = solved_count

        # Create placeholder problems for solved problems in this contest
        # We use difficulty distribution heuristics since we don't have per-problem data:
        # LC contest problems are always indexed 1, 2, 3, 4 with Easy, Medium, Medium, Hard ordering
        diff_map = {1: "Easy", 2: "Medium", 3: "Medium", 4: "Hard"}
        for i in range(1, total_problems + 1):
            prob_id = f"LC-{slug}-Q{i}"
            existing_prob = db.query(Problem).filter(Problem.problem_id == prob_id).first()
            if not existing_prob:
                is_solved = i <= solved_count  # Assume easiest problems solved first
                existing_prob = Problem(
                    problem_id=prob_id,
                    contest_id=c_id,
                    name=f"Q{i}",
                    index=str(i),
                    difficulty=diff_map.get(i, "Medium"),
                    tags="",  # No tags available without per-problem API call
                    status="solved" if is_solved else "attempted"
                )
                db.add(existing_prob)

                # Create a submission record for solved problems
                # We cannot get actual solve time from LeetCode without auth
                if is_solved:
                    sub_id = f"lc_sub_{slug}_q{i}_{user_id}"
                    existing_sub = db.query(Submission).filter(Submission.submission_id == sub_id).first()
                    if not existing_sub:
                        new_sub = Submission(
                            submission_id=sub_id,
                            problem_id=prob_id,
                            user_id=user_id,
                            language="Unknown",
                            verdict="OK",
                            time_seconds=None,  # LeetCode does NOT expose per-problem contest solve time
                            participant_type="CONTESTANT"
                        )
                        db.add(new_sub)

    db.commit()
    return {
        "success": True,
        "handle": handle,
        "rating": profile.get("rating", 0),
        "contests_synced": contests_synced,
        "total_contests_attended": profile.get("contests_attended", 0)
    }
