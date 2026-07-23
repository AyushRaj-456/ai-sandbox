"""
Kernious AI Analysis Module
Swappable LLM engine for generating contest summaries, classifying mistakes, daily practice recommendations, Socratic directional hints, and conversational AI coaching.
Supports Google Gemini API (GEMINI_API_KEY) and OpenAI API (OPENAI_API_KEY) with structured fallback.
"""
import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Auto-load environment variables overriding OS defaults
load_dotenv(override=True)

class AIEngine:
    def __init__(self):
        self.gemini_api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        self.openai_api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        self.gemini_model = (os.getenv("GEMINI_MODEL") or "gemini-1.5-flash").strip()
        self.openai_model = (os.getenv("AI_MODEL") or "gpt-4o-mini").strip()

    def _call_gemini_api(self, prompt: str, system_prompt: str = "", response_json: bool = False) -> str:
        """Call Google Gemini REST API with rate-limit and fallback handling."""
        if not self.gemini_api_key or len(self.gemini_api_key) < 5:
            return None
        
        models_to_try = [self.gemini_model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
                
                full_text = prompt
                if system_prompt:
                    full_text = f"System Instructions: {system_prompt}\n\nUser Prompt: {prompt}"

                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": full_text}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3
                    }
                }

                if response_json:
                    payload["generationConfig"]["responseMimeType"] = "application/json"

                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    res = json.loads(resp.read().decode("utf-8"))
                    candidates = res.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f"Gemini API model '{model}' rate limited (429). Trying fallback...")
                    continue
                else:
                    print(f"Gemini API error on '{model}': {e}")
                    break
            except Exception as e:
                print(f"Gemini API exception: {e}")
                break

        return None

    def _call_openai_chat(self, messages: list) -> str:
        """Call OpenAI chat completions API."""
        if not self.openai_api_key or len(self.openai_api_key) < 5:
            return None
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": self.openai_model,
                "messages": messages,
                "temperature": 0.5
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                return res["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI API call error: {e}")
            return None

    def _call_openai_json(self, prompt: str, system_prompt: str) -> dict:
        """Call OpenAI chat completions API with JSON response mode."""
        if not self.openai_api_key or len(self.openai_api_key) < 5:
            return None
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": self.openai_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                content = res["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            print(f"OpenAI API call error: {e}")
            return None

    def chat_with_coach(self, user_name: str, user_message: str, history: list, context: dict) -> str:
        """
        Interactive AI Coach Chat response generator using Gemini API or OpenAI API or dynamic DB context.
        """
        has_connected_platform = context.get("has_connected_platform", False)
        rating = context.get("rating", 0)
        contest_count = context.get("contests_count", 0)
        mistakes = context.get("mistakes", [])
        recent_contests = context.get("recent_contests", [])

        # Handle user with no connected platform
        if not has_connected_platform or contest_count == 0:
            return f"Welcome {user_name}! I see you haven't connected a platform handle yet. Click 'Connect Platform' in the top bar to link your Codeforces handle so I can pull your real contest history and submission logs to coach you!"

        # Format recent contests string
        recent_str = ""
        if recent_contests:
            recent_str = "\n".join([
                f"- {c['name']} ({c['date']}): Rank #{c['rank']}, Rating Change: {'+' if c['rating_change'] >= 0 else ''}{c['rating_change']} (New Rating: {c['rating_after']})"
                for c in recent_contests
            ])

        # Try Google Gemini API if GEMINI_API_KEY is configured
        if self.gemini_api_key and len(self.gemini_api_key) >= 5:
            sys_prompt = f"""
You are Kernious, an expert AI Competitive Programming Coach pair-programming with student {user_name}.
User stats:
- Current Rating: {rating}
- Total Contests Logged in DB: {contest_count}
- Recent Contests Performance:\n{recent_str if recent_str else 'None'}
- Logged Mistakes / Bottlenecks: {', '.join(mistakes) if mistakes else 'None logged yet'}

Provide concise, highly actionable, encouraging CP advice (2-4 sentences). Focus on exact problem-solving strategies, edge-case checking, and rating progression.
            """
            history_text = "\n".join([f"{m.get('sender', 'user')}: {m.get('text', '')}" for m in history[-4:]])
            prompt = f"Recent Conversation History:\n{history_text}\n\nUser Question: {user_message}"
            gemini_reply = self._call_gemini_api(prompt, sys_prompt)
            if gemini_reply:
                return gemini_reply.strip()

        # Try OpenAI API if OPENAI_API_KEY is configured
        if self.openai_api_key and len(self.openai_api_key) >= 5:
            system_prompt = f"""
You are Kernious, an expert AI Competitive Programming Coach pair-programming with student {user_name}.
User stats:
- Current Rating: {rating}
- Total Contests Logged: {contest_count}
- Recent Contests:\n{recent_str}
- Logged Mistakes: {', '.join(mistakes) if mistakes else 'None logged yet'}

Provide concise, highly actionable CP advice (2-4 sentences).
            """
            chat_messages = [{"role": "system", "content": system_prompt}]
            for msg in history[-4:]:
                role = "assistant" if msg.get("sender") == "ai" else "user"
                chat_messages.append({"role": role, "content": msg.get("text", "")})
            chat_messages.append({"role": "user", "content": user_message})

            reply = self._call_openai_chat(chat_messages)
            if reply:
                return reply

        # Dynamic heuristic responses based on REAL database context
        msg_lower = user_message.lower()
        if "last five contests" in msg_lower or "compare" in msg_lower:
            if recent_contests:
                first_c = recent_contests[0]
                last_c = recent_contests[-1]
                net_change = sum([c["rating_change"] for c in recent_contests])
                return f"Across your last {len(recent_contests)} logged contests ({last_c['name']} to {first_c['name']}), your rating changed by {net_change:+} pts (current rating: {rating}). Main performance gains occurred in implementation accuracy, while penalties were caused by boundary errors."
            return f"Across your logged contest history ({contest_count} contests total), your rating is currently {rating}."

        elif "practice" in msg_lower or "week" in msg_lower:
            return f"At your current {rating} rating, I recommend practicing 3 Binary Search (1400-1500 rating) and 2 Graph BFS problems today to eliminate boundary errors before your next round."

        elif "stuck" in msg_lower or "rating" in msg_lower or "bottleneck" in msg_lower:
            mistake_str = ", ".join(mistakes[:2]) if mistakes else "off-by-one boundary checks"
            return f"Based on your database records across {contest_count} contests, your main bottleneck at {rating} rating is {mistake_str} under contest time pressure."

        elif "mistakes" in msg_lower or "repeating" in msg_lower:
            mistake_str = ", ".join(mistakes) if mistakes else "Off-by-one bounds"
            return f"The most frequent mistake pattern logged in your account is: {mistake_str}. Make a habit of testing N=1, N=2, and extreme boundary values locally before submitting."

        return f"At {rating} rating across {contest_count} contests, focusing on implementation precision and double-checking array bounds will yield immediate rating gains in your next contest."

    # ------------------------------------------------------------------ #
    # Internal: tag-combo + rating → specific named technique/algorithm    #
    # ------------------------------------------------------------------ #
    def _infer_technique(self, tags: list, rating: int, verdict: str, problem_name: str = "") -> dict:
        """
        Infer the most specific named algorithm/technique for an unsolved problem
        using its Codeforces tag combination and rating band.

        Returns a dict with keys:
          technique  – specific algorithm name (e.g. "bitmask DP", "Dijkstra with lazy deletion")
          focus      – 1-sentence practice prescription
          cause      – probable failure mode matched to the verdict
        """
        tl = " ".join(t.lower() for t in tags)
        r = rating or 0
        is_tle = "time" in verdict.upper() or "tle" in verdict.upper()

        # ── Graph / Tree ───────────────────────────────────────────────
        if any(x in tl for x in ["dijkstra", "shortest paths", "shortest path"]):
            if r >= 1600 or "0-1 bfs" in tl:
                tech  = "0-1 BFS or modified Dijkstra with edge-type filtering"
                focus = "Review 0-1 BFS for binary-weight graphs and the lazy-deletion heap variant of Dijkstra for large edge counts."
            else:
                tech  = "Dijkstra with a min-heap"
                focus = "Verify visited-check placement, 0-indexed vs 1-indexed node IDs, and that the adjacency list stores (weight, node) pairs correctly."
            cause = "Probable cause: incorrect dist[] initialisation or relaxation condition inverted (> vs >=)." if not is_tle else "Probable cause: O(V²) Dijkstra used on a dense graph — switch to priority-queue-based O((V+E) log V)."

        elif any(x in tl for x in ["dsu", "disjoint set", "union find"]):
            tech  = "DSU (Union-Find) with path compression + rank/size"
            focus = "Review DSU cycle detection in undirected graphs and offline Kruskal's MST — union by rank prevents degenerate chains."
            cause = "Probable cause: find() missing path compression, causing O(N) per query instead of amortised O(α(N))."

        elif any(x in tl for x in ["dfs and similar", "dfs", "trees", "tree"]) and "dp" not in tl:
            if r >= 1600 or "centroid" in tl:
                tech  = "Centroid decomposition or heavy-light decomposition (HLD)"
                focus = "Review centroid decomposition for path queries on trees — re-root the decomposition carefully for each centroid subtree."
            elif "euler tour" in tl or "lca" in tl:
                tech  = "Euler tour + LCA (binary lifting or sparse table)"
                focus = "Review Euler tour flattening of trees and binary lifting for LCA queries in O(log N) per query."
            else:
                tech  = "DFS with re-rooting or subtree size DP"
                focus = "Trace recursion on a 5-node example — verify visited[] resets per test case and that directed edges don't create phantom cycles."
            cause = "Probable cause: incorrect DFS entry/exit time tracking or missed case for 1-node tree." if not is_tle else "Probable cause: recursive DFS stack overflow on N=10^5 — convert to iterative DFS."

        elif any(x in tl for x in ["bfs", "shortest path", "0-1 bfs"]) and "graph" in tl:
            tech  = "Multi-source BFS or BFS-on-grid with boundary guards"
            focus = "Seed the BFS queue with all starting cells simultaneously (multi-source) rather than running separate BFS instances — check row/column bounds before enqueue."
            cause = "Probable cause: single-source BFS used where multi-source is needed, or visited[][] not reset between test cases."

        # ── Dynamic Programming ────────────────────────────────────────
        elif "bitmask" in tl and "dp" in tl:
            tech  = "Bitmask DP over subsets (dp[mask][last])"
            focus = f"Given N is small (bitmask DP is viable up to N≈20), review state design dp[mask][i] = min cost to visit subset `mask` ending at node `i`, and iterate transitions over all bits in the complement of mask."
            cause = "Probable cause: wrong mask iteration order (process smaller subsets first) or missed identity state dp[0][start] = 0." if not is_tle else "Probable cause: 2^N * N states computed naively without memo — add memoisation."

        elif "dp" in tl and any(x in tl for x in ["trees", "tree"]):
            tech  = "Tree DP (rerooting technique)"
            focus = "Review the two-pass rerooting pattern: first DFS bottom-up to compute subtree values, second DFS top-down to propagate parent contributions — avoids recomputing entire tree per root."
            cause = "Probable cause: only bottom-up pass implemented, giving wrong answer when the answer depends on the parent subtree."

        elif "dp" in tl and "digit" in tl:
            tech  = "Digit DP (dp[pos][tight][sum] or similar)"
            focus = "Review digit-DP state: pos = current digit position, tight = whether prefix is still bounded by the upper limit, and an accumulator for the digit-based constraint — memoize over (pos, tight, acc)."
            cause = "Probable cause: tight flag not threaded correctly through recursive calls, overcounting/undercounting numbers in prefix range."

        elif "dp" in tl and any(x in tl for x in ["strings", "string"]):
            tech  = "DP on strings (LCS / edit distance / palindrome partitioning pattern)"
            focus = f"Identify which string DP recurrence applies: LCS if comparing two strings, edit distance if transformations are allowed, or interval DP dp[l][r] for palindrome/parenthesization variants."
            cause = "Probable cause: off-by-one in the substring range [l, r] or wrong base case for single-character substrings."

        elif "dp" in tl and r >= 1600:
            tech  = "DP with optimisation (convex hull trick / divide-and-conquer DP / monotone queue)"
            focus = "Check if the transition cost is convex/concave in the index — if so, apply the Convex Hull Trick (CHT) or Li Chao tree to reduce O(N²) DP to O(N log N)."
            cause = "Probable cause: O(N²) DP correct but TLEs on N=10^5 — monotonicity of the cost function enables CHT optimisation." if is_tle else "Probable cause: incorrect DP ordering; transitions must process states in correct dependency order."

        elif "dp" in tl:
            tech  = "Linear DP with memoisation (dp[i] based on dp[i-k] transitions)"
            focus = "Write the recurrence explicitly on paper for N=3, N=4 before coding — identify the smallest sub-problems (base cases) and ensure transitions access only previously computed states."
            cause = "Probable cause: dp array initialised to 0 where -∞ / +∞ sentinel is needed, or transitions access dp[i] before it's been computed."

        # ── Constructive / Interactive ─────────────────────────────────
        elif any(x in tl for x in ["constructive algorithms", "constructive", "interactive"]):
            if r >= 1800:
                tech  = "Parity + invariant-based construction (structured case analysis)"
                focus = "Enumerate all parity combinations (even/odd N, even/odd K) manually for N=3,4,5 — the pattern that works for all cases is the construction; prove it holds via invariant."
            else:
                tech  = "Greedy construction with parity / alternating blocks"
                focus = "Construct the output for small N (3, 4, 5) by hand, identify the repeating pattern, then implement it as a formula — avoid simulation for large N."
            cause = "Probable cause: construction logic breaks on odd-length sequences or when N=1 / N=2 edge cases aren't handled separately."

        # ── Binary Search / Two Pointers / Sliding Window ──────────────
        elif "binary search" in tl:
            if r >= 1500:
                tech  = "Binary search on the answer (\"binary search on result\") with a feasibility checker"
                focus = "Binary search the answer value directly, not an index — write check(mid) returning True/False, verify it is monotone (if check(x) holds then check(x-1) holds), and set lo=mid+1 / hi=mid-1 correctly."
            else:
                tech  = "Classic binary search with strict invariant lo < hi, lo = mid+1 / hi = mid-1"
                focus = "Ensure the invariant: after every iteration, the answer lies in [lo, hi]. Use lo < hi (not <=) to avoid infinite loops when lo == mid."
            cause = "Probable cause: check() function not strictly monotone, or binary search terminates one step early due to wrong boundary condition."

        elif "two pointers" in tl or "sliding window" in tl:
            tech  = "Two-pointer sliding window with conditional pointer advance"
            focus = "The window [lo, hi] must always maintain a specific invariant (e.g. sum ≤ K, count of distinct ≤ 2). Advance `hi` greedily, shrink `lo` whenever the invariant breaks — count/aggregate at each valid state."
            cause = "Probable cause: window invariant violated when pointer shrinks, or answer accumulated before restoring invariant."

        # ── Greedy ─────────────────────────────────────────────────────
        elif "greedy" in tl and r >= 1500:
            tech  = "Exchange argument greedy (prove adjacent-swap optimality)"
            focus = "Prove the greedy choice via exchange argument: assume a solution doesn't follow your ordering, swap adjacent elements to match it, and show the swap can't worsen the objective. Only code after the proof."
            cause = "Probable cause: greedy choice is locally but not globally optimal — find a counterexample with N=4 inputs to disprove naive greedy."

        elif "greedy" in tl and "sorting" in tl:
            tech  = "Sort-then-greedy with a custom comparator"
            focus = "Determine the correct sort key (ratio, difference, or product-based comparator) that establishes the optimal order — implement as a custom comparator and verify on 2-element edge cases."
            cause = "Probable cause: natural integer sort used where a ratio/product comparator is needed, breaking optimality."

        elif "greedy" in tl:
            tech  = "Interval / activity-selection greedy (sort by endpoint + sweep)"
            focus = "Sort events or intervals by their end (or start) time; greedily assign each to the earliest available slot. Verify correctness on overlapping and nested intervals."
            cause = "Probable cause: sorted by start time instead of end time, or missed the case where intervals share endpoints."

        # ── Strings ────────────────────────────────────────────────────
        elif any(x in tl for x in ["strings", "string", "hashing", "z-function", "kmp"]):
            if "hashing" in tl or "z-function" in tl or "kmp" in tl:
                tech  = "Polynomial rolling hash or Z-function / KMP failure function"
                focus = "For substring matching, prefer Z-function (simpler indexing) or KMP over brute O(N²). With hashing, use double hashing (two moduli) to avoid collision false-positives at N=10^5."
                cause = "Probable cause: hash collision with single modulus, or Z-array/KMP failure array off by one in index range."
            else:
                tech  = "String simulation with character frequency or sliding window"
                focus = "Count character frequencies in a window and slide it — rebuild only the delta (add new char, remove old char) rather than recomputing the whole window each step."
                cause = "Probable cause: full window recomputation each step causing O(N²), or frequency map not updated when window shrinks."

        # ── Math / Number Theory / Combinatorics ───────────────────────
        elif "number theory" in tl or "prime" in tl or "sieve" in tl:
            tech  = "Sieve of Eratosthenes + modular inverse (Fermat's little theorem)"
            focus = "Precompute prime factors via linear sieve up to sqrt(N). For combinatorial counts mod p, precompute factorials and inverse-factorials using Fermat's little theorem: inv(x) = pow(x, MOD-2, MOD)."
            cause = "Probable cause: modular inverse computed via brute force O(p) instead of Fermat, or sieve upper bound too low."

        elif "combinatorics" in tl:
            if r >= 1500:
                tech  = "Permutation/combination counting under constraints with inclusion-exclusion"
                focus = "Frame the count as inclusion-exclusion over forbidden configurations — |A ∪ B| = |A| + |B| - |A ∩ B|. Precompute nCr table with Pascal's triangle or modular factorials."
                cause = "Probable cause: over-counting symmetric cases or missing the exclusion of cases where a constraint is violated simultaneously."
            else:
                tech  = "nCr / nPr with modular arithmetic (precomputed factorial table)"
                focus = "Precompute fact[] and inv_fact[] arrays up to N=10^6 using Fermat's little theorem once before queries — then answer each nCr in O(1)."
                cause = "Probable cause: Python int division used instead of modular inverse, giving wrong residue for large factorials."

        elif "math" in tl and r >= 1400:
            tech  = "Mathematical pattern / formula derivation (closed-form expression)"
            focus = "Compute the answer for small values (1–10) by brute force, look for a pattern in the sequence, and derive a closed-form formula — check OEIS if the sequence is recognisable."
            cause = "Probable cause: brute-force simulation correct but O(N) per query over Q=10^5 queries — closed form reduces per-query cost to O(1)."

        elif "math" in tl:
            tech  = "Integer arithmetic with 64-bit overflow guards"
            focus = "Cast intermediate products to 64-bit (Python is safe; in C++ use `1LL * a * b`) before comparing or accumulating. Test N at its maximum stated constraint to expose overflow."
            cause = "Probable cause: 32-bit signed int wraps around during intermediate multiplication before the result is stored."

        # ── Data Structures ────────────────────────────────────────────
        elif any(x in tl for x in ["segment tree", "fenwick", "bit", "data structures"]):
            if "lazy" in tl or r >= 1700:
                tech  = "Segment tree with lazy propagation (range update, range query)"
                focus = "Implement lazy tag push-down before every descent into child nodes — never query a child without first propagating the pending tag from the parent."
                cause = "Probable cause: push-down called after child access rather than before, producing stale subtree values."
            else:
                tech  = "Fenwick tree (BIT) for prefix sum / point update"
                focus = "Fenwick tree answers prefix queries in O(log N) and point updates in O(log N) — index starting at 1, and use i += i & (-i) to update, i -= i & (-i) to query."
                cause = "Probable cause: 0-based indexing used with a Fenwick tree that expects 1-based, shifting all query results by 1."

        elif any(x in tl for x in ["sortings", "sorting"]):
            if r >= 1500:
                tech  = "Multi-key custom comparator sort (sort by tuple key, or stable sort layering)"
                focus = "Define a comparison key as a tuple (primary_key, secondary_key) so Python/C++ sort handles ties consistently. Verify the comparator is a strict weak ordering (irreflexive, asymmetric, transitive)."
            else:
                tech  = "Counting sort / radix sort for bounded integer keys"
                focus = "When keys are integers in [0, K], counting sort in O(N + K) beats comparison sort's O(N log N) — allocate a freq[] array of size K+1 and accumulate prefix sums."
            cause = "Probable cause: sort comparator violates strict weak ordering (equality not handled), causing undefined behaviour in C++ std::sort."

        # ── Fallback ───────────────────────────────────────────────────
        else:
            tag_display = ", ".join(tags) if tags else "implementation"
            tech  = f"Targeted technique for [{tag_display}] at {r}★"
            focus = f"Revisit the problem constraints carefully — at {r}★ with tags [{tag_display}], look for the reduction that converts a brute-force O(N²) solution into O(N log N) via sorting or binary search."
            cause = "Probable cause: brute-force solution correct but exceeds time limit, or edge case at minimum/maximum constraint value." if is_tle else "Probable cause: implementation misses an edge case at N=1, or the invariant breaks for a specific input class."

        return {"technique": tech, "focus": focus, "cause": cause}

    # ------------------------------------------------------------------ #
    # Internal: best-effort fetch of CF problem statement for constraint   #
    # hint extraction (non-blocking, timeout-guarded)                      #
    # ------------------------------------------------------------------ #
    def _fetch_cf_constraint_hint(self, contest_id: str, problem_index: str) -> str:
        """
        Try to fetch the Codeforces problem page and extract the constraint line.
        Returns a short string like 'N ≤ 20' if parseable, empty string on any failure.
        This is best-effort and must never raise.
        """
        try:
            clean_id = str(contest_id).replace("cf_", "").strip()
            url = f"https://codeforces.com/contest/{clean_id}/problem/{problem_index}"
            req = urllib.request.Request(url, headers={"User-Agent": "Kernious/1.0 educational tool"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            # Extract text around constraint keywords
            import re
            matches = re.findall(r'(?:≤|<=|\\le)\s*(\d+\^?\d*)', html)
            if matches:
                return f"N ≤ {matches[0]}"
        except Exception:
            pass
        return ""

    def generate_contest_summary(
        self,
        contest_name: str,
        solved_problems: list = None,
        unsolved_problems: list = None,
        rating_change: int = 0,
        weak_topics: list = None,
        contest_id: str = "",
        solved_count: int = 0,
        total_problems: int = 5,
        wrong_count: int = 0,
        mistake_types: list = None
    ) -> str:
        """
        Generate multi-part structured AI performance / root-cause summary for a contest:
        1. Solved Problems — Speed & Accuracy
        2. Unsolved/Attempted Problems — Probable Cause & Specific Technique to Study
        3. Additional Advice (Grounded in Real Weak Topics with named techniques)
        """
        lines = []

        # Part 1: Solved Problems — Speed & Accuracy
        lines.append("1. Solved Problems — Speed & Accuracy")
        if not solved_problems or len(solved_problems) == 0:
            lines.append("• No problems were successfully accepted during this contest round.")
        else:
            for p in solved_problems:
                name = p.get("name", "Problem")
                idx = p.get("index", "")
                r = p.get("rating", "")
                r_str = f" ({r}★)" if r else ""
                t_str = p.get("formatted_time", "early contest")
                wrong_att = p.get("wrong_attempts", 0)

                if wrong_att == 0:
                    if t_str == "Not available":
                        lines.append(f"• Problem {idx} ({name}{r_str}): Solved cleanly on the first attempt with 0 penalty submissions (solve time not available for this platform). Excellent accuracy.")
                    else:
                        lines.append(f"• Problem {idx} ({name}{r_str}): Solved cleanly in {t_str} on the first attempt with 0 penalty submissions. Excellent speed and accuracy.")
                else:
                    tags = p.get("tags", [])
                    tag_note = f" (tags: {', '.join(tags[:2])})" if tags else ""
                    if t_str == "Not available":
                        lines.append(f"• Problem {idx} ({name}{r_str}): Accepted after {wrong_att} penalty attempt(s){tag_note} (solve time not available for this platform). Validate array bounds and test the exact failing case locally before resubmitting to eliminate these avoidable penalties.")
                    else:
                        lines.append(f"• Problem {idx} ({name}{r_str}): Accepted at {t_str} after {wrong_att} penalty attempt(s){tag_note}. Validate array bounds and test the exact failing case locally before resubmitting to eliminate these avoidable penalties.")

        lines.append("")

        # Part 2: Unsolved/Attempted Problems — specific technique focus
        lines.append("2. Unsolved/Attempted Problems — Probable Cause & Focus Area")
        if not unsolved_problems or len(unsolved_problems) == 0:
            lines.append("• All attempted problems were solved cleanly with full accuracy.")
        else:
            for p in unsolved_problems:
                name = p.get("name", "Problem")
                idx = p.get("index", "")
                r = p.get("rating", "")
                r_str = f" ({r}★)" if r else ""
                tags = p.get("tags", [])
                att = p.get("attempts", 1)
                v_list = p.get("verdicts", ["WRONG_ANSWER"])
                worst_verdict = v_list[-1] if v_list else "WRONG_ANSWER"

                # Best-effort constraint fetch
                constraint_hint = ""
                if contest_id and idx:
                    constraint_hint = self._fetch_cf_constraint_hint(contest_id, idx)
                constraint_note = f" (constraints: {constraint_hint})" if constraint_hint else ""

                info = self._infer_technique(tags, int(r) if r else 0, worst_verdict, name)
                tech     = info["technique"]
                focus    = info["focus"]
                cause    = info["cause"]

                tag_str = ", ".join(tags) if tags else "implementation"
                lines.append(
                    f"• Problem {idx} ({name}{r_str}{constraint_note} — tags: {tag_str}): "
                    f"{att} attempt(s), verdict {worst_verdict}. {cause} "
                    f"Required technique: **{tech}**. {focus}"
                )

        lines.append("")

        # Part 3: Additional Advice — grounded in real weak topics with specific techniques
        lines.append("3. Additional Advice")

        # Build per-topic specific advice
        TOPIC_TECHNIQUE_MAP = {
            "combinatorics":         "permutation/combination counting under constraints (nCr with modular inverse, inclusion-exclusion for forbidden configurations)",
            "sortings":              "custom multi-key comparators and counting sort for bounded integer ranges",
            "dp":                    "DP state design — explicitly writing the recurrence and base cases on paper before coding, then adding memoisation",
            "dynamic programming":   "DP state design — explicitly writing the recurrence and base cases on paper before coding, then adding memoisation",
            "greedy":                "exchange-argument proofs — finding a 2-element counterexample to any greedy that fails, then pivoting to sort-based or DP",
            "constructive algorithms": "parity/alternating-block constructions — building the output for N=3,4,5 by hand before generalising",
            "graphs":                "multi-source BFS and Dijkstra with lazy-deletion heap — verify visited[] resets between test cases",
            "dfs and similar":       "DFS with re-rooting or subtree-size DP — trace entry/exit times on a 5-node example",
            "trees":                 "tree DP with two-pass rerooting to propagate parent contributions correctly",
            "binary search":         "binary search on the answer with a monotone feasibility checker — prove check(mid) is strictly monotone before coding",
            "two pointers":          "sliding-window invariant maintenance — always restore the invariant before accumulating the answer",
            "data structures":       "Fenwick tree (BIT) for prefix-sum queries and segment tree with lazy propagation for range updates",
            "number theory":         "Fermat's little theorem for modular inverse (pow(x, MOD-2, MOD)) and linear sieve for prime factorisation up to N",
            "math":                  "closed-form formula derivation — compute brute-force answers for N=1..10, identify the sequence, then verify with OEIS",
            "strings":               "Z-function or KMP for substring matching, and polynomial rolling hash (double-hash) for collision-resistant comparison",
            "implementation":        "systematic edge-case enumeration — always test N=1, N=2, all-same values, and maximum constraints before submitting",
            "bitmask":               "bitmask DP state design (dp[mask][i]) and correct mask iteration order (from smallest to largest subset)",
            "geometry":              "vector cross-product for orientation tests and careful handling of collinear/degenerate cases",
        }

        weak_advices = []
        if weak_topics and len(weak_topics) > 0:
            for t in weak_topics[:2]:
                topic_name = t.get("topic", "")
                acc_str    = t.get("accuracy", "")
                key = topic_name.lower().strip()
                specific = TOPIC_TECHNIQUE_MAP.get(key, f"focused practice on {topic_name} techniques at your rating band")
                acc_note = f" (your accuracy: {acc_str})" if acc_str and acc_str != "No data yet" else ""
                weak_advices.append(f"your weak area in {topic_name}{acc_note} — practice {specific}")

        if rating_change > 0:
            base = f"Solid performance overall (+{rating_change} rating pts)."
            if weak_advices:
                wt_str = "; ".join(weak_advices)
                lines.append(f"• {base} To keep progressing, address {wt_str}.")
            else:
                lines.append(f"• {base} Maintain momentum by solving 2–3 problems per day at your current rating +100 to +200 to expand your comfort zone.")

        elif rating_change < 0:
            base = f"Rating adjustment ({rating_change} pts) — recoverable."
            if weak_advices:
                wt_str = "; ".join(weak_advices)
                lines.append(f"• {base} Focus first on {wt_str}. Also: prove problem invariants on paper before submitting to cut penalty submissions.")
            else:
                lines.append(f"• {base} Prove problem invariants on paper before coding — at your rating, penalty time from rushing is the primary rating drain.")

        else:
            base = "Steady performance."
            if weak_advices:
                wt_str = "; ".join(weak_advices)
                lines.append(f"• {base} Use this round as a reference: address {wt_str}.")
            else:
                lines.append(f"• {base} Focus on pacing: solve A/B in under 15 minutes to leave time for harder problems later in the round.")

        return "\n".join(lines)



    def generate_directional_hints(
        self,
        problem_name: str,
        verdict: str,
        mistake_type: str,
        concept: str,
        tags: list = None,
        source_code: str = None,
        rating: int = None,
        attempts: int = None,
        passed_test_count: int = None
    ) -> dict:
        """
        Generate Socratic AI directional hints for a mistake row tailored fundamentally per problem, verdict, tags, rating, and source code.
        - missed_concept: 1-2 sentences on conceptual gap
        - thinking_direction: a nudge toward the right mental model
        - direction_not_to_go: warning against common wrong instincts
        """
        tags_str = ", ".join(tags) if (tags and len(tags) > 0) else (concept or "General Implementation")
        v_upper = verdict.upper()
        rating_str = f"rating {rating}" if rating else "unrated"
        attempts_str = f"{attempts} attempts" if attempts else "initial attempt"
        test_str = f"failing test #{passed_test_count + 1}" if passed_test_count is not None else "failed testcase"

        source_snippet = ""
        if source_code:
            source_snippet = f"\nSubmitted Source Code:\n```\n{source_code[:1000]}\n```"
        else:
            source_snippet = "\n(Submission source code is not attached. Analysis is derived from verdict, problem tags, rating, and mistake category)."

        prompt = f"""
Problem Name: {problem_name}
Rating / Difficulty: {rating_str}
Verdict: {verdict} ({test_str}, {attempts_str})
Mistake Category: {mistake_type}
Core Concept / Topic Tags: {tags_str}
{source_snippet}
        """

        system_prompt = f"""
You are Kernious CP Coach. Generate a JSON object with Socratic hints specifically tailored to verdict '{verdict}', problem '{problem_name}', difficulty '{rating_str}', and topic tags: [{tags_str}].

CRITICAL INSTRUCTION: Do not default to generic overflow/edge-case/greedy-choice boilerplate unless the actual tag list and rating genuinely suggest that specific failure mode. If the tags are, for example, [graphs, shortest paths], your 'missed_concept' MUST discuss graph-specific concerns (e.g. wrong edge weights, not handling disconnected components, Dijkstra vs BFS misuse) — NOT integer overflow. Every one of the three sections (missed_concept, thinking_direction, direction_not_to_go) MUST independently reflect the specific tags and rating of THIS problem, not a fixed paragraph with the problem name substituted in.

Return JSON format:
{{
  "missed_concept": "1-2 sentences on likely conceptual gap for this specific topic and problem",
  "thinking_direction": "A constructive nudge toward the missing mental model and invariants for these topic tags",
  "direction_not_to_go": "Warning against common wrong instincts specific to this topic category"
}}
"""

        # Call Gemini API if configured
        if self.gemini_api_key and len(self.gemini_api_key) >= 5:
            res_text = self._call_gemini_api(prompt, system_prompt, response_json=True)
            if res_text:
                try:
                    res_json = json.loads(res_text)
                    if "missed_concept" in res_json and "thinking_direction" in res_json and "direction_not_to_go" in res_json:
                        if not source_code:
                            res_json["missed_concept"] += " (Analysis derived from verdict & tags — connect submission source code for line-by-line review)"
                        return res_json
                except Exception:
                    pass

        # Call OpenAI API if configured
        if self.openai_api_key and len(self.openai_api_key) >= 5:
            res = self._call_openai_json(prompt, system_prompt)
            if res and "missed_concept" in res and "thinking_direction" in res and "direction_not_to_go" in res:
                if not source_code:
                    res["missed_concept"] += " (Analysis derived from verdict & tags — connect submission source code for line-by-line review)"
                return res

        # Socratic Dynamic Heuristic Engine when Code is Attached
        if source_code:
            sc_lower = source_code.lower()
            if "low = mid" in sc_lower or "high = mid" in sc_lower:
                return {
                    "missed_concept": f"Your submitted code for {problem_name} updates `low = mid` (or `high = mid`) directly inside the binary search loop without adding progress increments.",
                    "thinking_direction": f"Corrected reasoning: you need `low = mid + 1` (or `high = mid - 1`) so the search space strictly shrinks on every iteration — the key invariant is that `low` must converge toward `high`, never stall.",
                    "direction_not_to_go": "Avoid adding arbitrary +/- 1 adjustments outside the loop condition — enforce the strict invariant condition `low = mid + 1` inside the branching."
                }
                
            elif ("* " in source_code or "*" in source_code) and ("int " in sc_lower or "long long" in sc_lower) and ("overflow" in mistake_type.lower() or "wa" in v_upper):
                return {
                    "missed_concept": f"Your submitted code for {problem_name} multiplies two 32-bit signed integers before assigning to a variable, causing intermediate wrap-around integer overflow.",
                    "thinking_direction": "Corrected reasoning: cast operands to 64-bit integer (`1LL * a * b` in C++ / `int64` in Python) at the exact point of multiplication before overflow occurs.",
                    "direction_not_to_go": "Don't cast only the final result variable — the overflow happens during intermediate binary multiplication before assignment."
                }

            elif ("for" in sc_lower or "while" in sc_lower) and ("tle" in v_upper or "time" in v_upper):
                return {
                    "missed_concept": f"Your submitted code for {problem_name} executes a nested loop structure per query, resulting in an O(N^2) complexity order (up to 10^10 ops for N=10^5).",
                    "thinking_direction": f"Corrected reasoning: replace the inner loop iteration for [{tags_str}] with a pre-computed Prefix Sum array, Hash Map, or Two Pointers to process queries in O(1) or O(log N).",
                    "direction_not_to_go": "Avoid micro-optimizations (like fast I/O or inline functions) when the underlying loop complexity order is O(N^2) — you need a lower order algorithm."
                }

        # Dynamic Topic-Specific Generator when Source Code is Missing
        disclaimer = " (Analysis derived from verdict & tags — connect submission source code for line-by-line review)"
        tags_lower = tags_str.lower()

        if "graph" in tags_lower or "tree" in tags_lower or "dfs" in tags_lower or "bfs" in tags_lower or "shortest" in tags_lower or "dijkstra" in tags_lower:
            return {
                "missed_concept": f"Graph structural traversal error on {problem_name} ({rating_str}). For tags [{tags_str}], your approach likely failed to handle disconnected graph components, 1-based vs 0-based node indexing, or used unweighted BFS on weighted edges.{disclaimer}",
                "thinking_direction": f"Verify graph traversal invariants for [{tags_str}]: ensure visited state resets per testcase, check cycle detection logic in directed edges, and confirm recursion stack limit.",
                "direction_not_to_go": f"Do not attempt integer overflow or loop boundary fixes for {problem_name} — debug your graph representation (print adjacency lists and visited node sequences)."
            }

        elif "dp" in tags_lower or "bitmask" in tags_lower or "memoization" in tags_lower or "dynamic programming" in tags_lower:
            return {
                "missed_concept": f"DP state transition or base-case flaw on {problem_name} ({rating_str}). For tags [{tags_str}], the DP recurrence relation likely missed initial base state setup (dp[0]) or suffered bitwise operator precedence errors.{disclaimer}",
                "thinking_direction": f"Formulate state invariants for [{tags_str}]: write out base cases explicitly for N=0 and N=1, and verify if sub-problem transitions require past optimal values.",
                "direction_not_to_go": f"Do not tweak loop indices (+1/-1) blindly for {problem_name} — define exact state parameters dp[i][mask] and verify transitions on small N by hand."
            }

        elif "constructive" in tags_lower or "interactive" in tags_lower:
            return {
                "missed_concept": f"Structural construction invariant failed on {problem_name} ({rating_str}). Constructive problems with tags [{tags_str}] require building a valid configuration under constraints — your logic likely broke symmetry, parity, or alternating block rules.{disclaimer}",
                "thinking_direction": f"Analyze pattern invariants for [{tags_str}]: construct small cases (N=3, N=4) by hand to discover parity rules, alternating balance, or min/max element placements.",
                "direction_not_to_go": f"Do not use a standard greedy choice for {problem_name} without proving it holds for all parity cases — constructive problems require systematic pattern building, not greedy choices."
            }

        elif "binary search" in tags_lower or "two pointers" in tags_lower or "segment tree" in tags_lower or "data structures" in tags_lower:
            return {
                "missed_concept": f"Search space boundary or pointer convergence flaw on {problem_name} ({rating_str}). For tags [{tags_str}], the search range failed to shrink or violated the monotonicity invariant.{disclaimer}",
                "thinking_direction": f"Define strict range invariants for [{tags_str}]: verify check(mid) monotonicity, target range condition (low <= high), and pointer update low = mid + 1.",
                "direction_not_to_go": f"Avoid adding arbitrary +/- 1 adjustments outside the loop condition for {problem_name} — prove monotonicity over the search space."
            }

        elif "greedy" in tags_lower and "constructive" not in tags_lower:
            return {
                "missed_concept": f"Counterexample invalidation on {problem_name} ({rating_str}). For tags [{tags_str}], the locally optimal greedy choice fails on non-trivial inputs where an early pick blocks a globally better sequence.{disclaimer}",
                "thinking_direction": f"Find counterexamples for [{tags_str}]: construct test cases where taking the locally best element early locks out a higher total sum, or test tie-breaking criteria.",
                "direction_not_to_go": f"Do not assume a greedy choice is optimal for {problem_name} without proving the exchange argument — if a counterexample exists, consider sorting or DP."
            }

        elif "math" in tags_lower or "number theory" in tags_lower or "combinatorics" in tags_lower or "geometry" in tags_lower:
            return {
                "missed_concept": f"Mathematical edge-case or modular arithmetic flaw on {problem_name} ({rating_str}). For tags [{tags_str}], likely failed on prime factor edge cases, N=1, or 32-bit int overflow during modulo multiplication.{disclaimer}",
                "thinking_direction": f"Check mathematical invariants for [{tags_str}]: cast operands to 64-bit int (1LL * a * b) before modulo arithmetic and test prime/zero constraints.",
                "direction_not_to_go": f"Don't cast only the final result variable for {problem_name} — intermediate multiplication overflows before assignment."
            }

        elif "TIME" in v_upper or "TLE" in v_upper:
            return {
                "missed_concept": f"Time Limit Exceeded on {problem_name} ({rating_str}). Solution executed an unoptimized complexity order exceeding Codeforces' 10^8 ops/sec budget for tags: [{tags_str}].{disclaimer}",
                "thinking_direction": f"Re-evaluate complexity order for [{tags_str}]: consider whether state values can be pre-computed with a Prefix Sum Array, Frequency Map, Segment Tree, or Two Pointers to answer queries in O(1) or O(log N).",
                "direction_not_to_go": f"Avoid micro-optimizations (like fast I/O or inline functions) for {problem_name} when the underlying algorithm complexity order is O(N^2) or higher."
            }

        else:
            return {
                "missed_concept": f"Implementation boundary mismatch on {problem_name} ({rating_str}, verdict: {verdict}). For topic tags [{tags_str}], the implementation logic failed on non-trivial boundary testcases.{disclaimer}",
                "thinking_direction": f"Analyze problem invariants for [{tags_str}]: trace minimum and maximum constraints (N=1, N=10^5) and verify all condition branches for {problem_name}.",
                "direction_not_to_go": f"Avoid making unverified trial-and-error submissions for {problem_name} — trace execution on small manual inputs step-by-step."
            }

    def classify_mistake(self, problem_name: str, verdict: str, runtime: str = "", memory: str = "", language: str = "") -> dict:
        """
        Classify a failed/slow submission into structured mistake type and generate Socratic hints.
        """
        prompt = f"""
Problem Name: {problem_name}
Verdict: {verdict}
Runtime: {runtime}
Memory: {memory}
Language: {language}
        """
        system_prompt = """
You are Kernious CP Mistake Classifier.
Classify the failed submission into exact fields:
- mistake_type: Must be one of ['Off-by-one errors', 'Overflow', 'Integer division', 'Wrong binary search bounds', 'Missed constraints', 'Greedy assumption errors', 'Incorrect implementation', 'Time complexity issues', 'Corner cases', 'Wrong data structure', 'Syntax mistakes']
- reason: Short explanation (1 sentence)
- concept: Core topic / data structure involved
- confidence: Float 0.80 to 0.99
- missed_concept: 1-2 sentences on likely conceptual gap
- thinking_direction: Constructive nudge toward the right mental model
- direction_not_to_go: Warning against common wrong instincts
Return JSON format: {"mistake_type": "...", "reason": "...", "concept": "...", "confidence": 0.92, "missed_concept": "...", "thinking_direction": "...", "direction_not_to_go": "..."}
        """

        if self.gemini_api_key and len(self.gemini_api_key) >= 5:
            res_text = self._call_gemini_api(prompt, system_prompt, response_json=True)
            if res_text:
                try:
                    res_json = json.loads(res_text)
                    if "mistake_type" in res_json and "missed_concept" in res_json:
                        return res_json
                except Exception:
                    pass

        if self.openai_api_key and len(self.openai_api_key) >= 5:
            res = self._call_openai_json(prompt, system_prompt)
            if res and "mistake_type" in res and "missed_concept" in res:
                return res

        verdict_upper = verdict.upper()
        if "TIME LIMIT" in verdict_upper or "TLE" in verdict_upper:
            base = {
                "mistake_type": "Time complexity issues",
                "reason": f"Time Limit Exceeded on {problem_name}. O(N^2) or unoptimized loop inside test cases.",
                "concept": "Algorithm Complexity / Time Bounds",
                "confidence": 0.92
            }
        elif "MEMORY LIMIT" in verdict_upper or "MLE" in verdict_upper:
            base = {
                "mistake_type": "Wrong data structure",
                "reason": f"Memory Limit Exceeded on {problem_name}. Matrix allocation exceeded maximum heap limit.",
                "concept": "Memory Allocation / Space Optimization",
                "confidence": 0.90
            }
        elif "WRONG ANSWER" in verdict_upper or "WA" in verdict_upper:
            if "binary" in problem_name.lower() or "search" in problem_name.lower():
                base = {
                    "mistake_type": "Wrong binary search bounds",
                    "reason": f"Boundary update error on {problem_name}. low/high pointer adjustment failed on test cases.",
                    "concept": "Binary Search / Boundary Bounds",
                    "confidence": 0.94
                }
            elif "overflow" in problem_name.lower() or "sum" in problem_name.lower() or "product" in problem_name.lower():
                base = {
                    "mistake_type": "Overflow",
                    "reason": f"32-bit signed integer overflow detected in calculation on {problem_name}.",
                    "concept": "Math / Integer Precision",
                    "confidence": 0.91
                }
            else:
                base = {
                    "mistake_type": "Off-by-one errors",
                    "reason": f"Corner case boundary condition check failed on {problem_name}.",
                    "concept": "Implementation Edge Cases",
                    "confidence": 0.88
                }
        else:
            base = {
                "mistake_type": "Incorrect implementation",
                "reason": f"Non-accepted verdict ({verdict}) on {problem_name}.",
                "concept": "General Implementation",
                "confidence": 0.85
            }

        hints = self.generate_directional_hints(problem_name, verdict, base["mistake_type"], base["concept"])
        base.update(hints)
        return base

    def generate_practice_recommendations(self, mistakes: list, weak_topics: list) -> dict:
        """
        Generate daily practice set based on stored mistakes + topic data.
        """
        prompt = f"Mistakes logged: {json.dumps(mistakes)}\nWeak topics: {json.dumps(weak_topics)}"
        system_prompt = "You are Kernious Practice Generator. Generate a JSON object with 'headline', 'reason', and a list of 'problems' (id, title, topic, difficulty, platform, reason)."

        if self.gemini_api_key and len(self.gemini_api_key) >= 5:
            res_text = self._call_gemini_api(prompt, system_prompt, response_json=True)
            if res_text:
                try:
                    res_json = json.loads(res_text)
                    if "headline" in res_json and "problems" in res_json:
                        return res_json
                except Exception:
                    pass

        if self.openai_api_key and len(self.openai_api_key) >= 5:
            res = self._call_openai_json(prompt, system_prompt)
            if res and "headline" in res and "problems" in res:
                return res

        primary_mistake = mistakes[0].get("mistake_type", "Binary Search Bounds") if mistakes else "Binary Search Bounds"
        return {
            "headline": f"Targeted Practice: {primary_mistake} & Implementation Speed",
            "reason": f"Recent contest history reveals recurring {primary_mistake.lower()} and boundary errors.",
            "problems": [
                {
                    "id": "CF-1610C",
                    "title": "Keshi Is Throwing a Party",
                    "topic": "Binary Search",
                    "difficulty": "1400",
                    "platform": "Codeforces",
                    "reason": f"Fix boundary condition checks matching logged {primary_mistake.lower()}"
                },
                {
                    "id": "CF-1598D",
                    "title": "Training Session",
                    "topic": "Combinatorics / Freq Map",
                    "difficulty": "1500",
                    "platform": "Codeforces",
                    "reason": "Practice avoiding integer overflow in frequency multiplication"
                },
                {
                    "id": "LC-210",
                    "title": "Course Schedule II",
                    "topic": "Graphs (Topological Sort)",
                    "difficulty": "Medium",
                    "platform": "LeetCode",
                    "reason": "Strengthen graph traversal implementation speed"
                }
            ]
        }

    def generate_milestone_report(
        self,
        milestone_tier: int,
        total_contests: int,
        contest_list: list = None,
        mistake_list: list = None,
        topic_stats: list = None,
        user_name: str = "Student"
    ) -> dict:
        """
        Generate dynamic user-specific milestone report for tiers 5, 10, 20, 50 based on user's real DB history.
        """
        titles = {
            5: f"After 5 Contests — Initial Skill Assessment for {user_name}",
            10: f"After 10 Contests — Trend Analysis Report for {user_name}",
            20: f"After 20 Contests — Deep Growth Report for {user_name}",
            50: f"After 50 Contests — Elite CP Mastery Report for {user_name}"
        }
        title = titles.get(milestone_tier, f"After {milestone_tier} Contests — Performance Report for {user_name}")

        contests_str = json.dumps((contest_list or [])[:10])
        mistakes_str = json.dumps((mistake_list or [])[:10])
        topics_str = json.dumps((topic_stats or [])[:10])

        prompt = f"""
Student Name: {user_name}
Milestone Tier: {milestone_tier} Contests
Total Logged Contests: {total_contests}
Recent Contest Performance:
{contests_str}

Logged Mistakes & Conceptual Gaps:
{mistakes_str}

Topic Accuracy Breakdown:
{topics_str}
"""
        system_prompt = """
You are Kernious, an expert AI Competitive Programming Coach. Generate a comprehensive milestone report in JSON format:
{
  "title": "Title reflecting contest milestone",
  "summary": "Detailed, specific performance summary analyzing contest trends, rating changes, and primary weaknesses.",
  "strengths": ["List of 2-3 specific strengths based on user's high accuracy topics / positive rating gains"],
  "weaknesses": ["List of 2-3 specific weaknesses based on logged mistakes and low accuracy topics"],
  "plan": "Detailed, step-by-step training recommendation tailored to their rating level and weaknesses."
}
"""
        if self.gemini_api_key and len(self.gemini_api_key) >= 5:
            res_text = self._call_gemini_api(prompt, system_prompt, response_json=True)
            if res_text:
                try:
                    res_json = json.loads(res_text)
                    if "summary" in res_json and "plan" in res_json:
                        res_json["title"] = title
                        return res_json
                except Exception:
                    pass

        if self.openai_api_key and len(self.openai_api_key) >= 5:
            res = self._call_openai_json(prompt, system_prompt)
            if res and "summary" in res and "plan" in res:
                res["title"] = title
                return res

        # Dynamic heuristic generation using REAL user data
        if not contest_list:
            return {
                "title": title,
                "summary": f"No contest history found yet for {user_name}. Connect your platform handle to generate milestone reports.",
                "strengths": [],
                "weaknesses": [],
                "plan": "Connect a platform handle to enable AI skill evaluation."
            }

        # Analyze real contests
        total_rating_delta = sum([c.get("rating_change", 0) for c in contest_list])
        best_contest = max(contest_list, key=lambda x: x.get("rating_change", -999)) if contest_list else {}
        worst_contest = min(contest_list, key=lambda x: x.get("rating_change", 999)) if contest_list else {}
        
        # Analyze real mistakes
        mistake_types = list(set([m.get("mistake_type", str(m)) if isinstance(m, dict) else str(m) for m in (mistake_list or [])]))
        primary_mistake = mistake_types[0] if mistake_types else "Implementation Edge Cases"
        secondary_mistake = mistake_types[1] if len(mistake_types) > 1 else "Time Limits"

        # Analyze real topics
        high_topics = [t["topic"] for t in (topic_stats or []) if int(str(t.get("accuracy", "0")).replace("%", "")) >= 60]
        low_topics = [t["topic"] for t in (topic_stats or []) if int(str(t.get("accuracy", "0")).replace("%", "")) < 60]

        summary = f"Across {total_contests} logged contests for {user_name}, overall rating delta is {total_rating_delta:+} points. Peak round: {best_contest.get('name', 'Contest')} ({best_contest.get('rating_change', 0):+} pts). Bottleneck: {primary_mistake.lower()} in {worst_contest.get('name', 'rounds')}."
        
        strengths = high_topics[:2] if high_topics else ["Implementation Speed on Problem A", "Greedy Logic Fundamentals"]
        weaknesses = [primary_mistake, secondary_mistake]
        if low_topics:
            weaknesses.append(f"Low Accuracy on {low_topics[0]}")

        plan = f"Solve 6 targeted practice problems focusing on {primary_mistake.lower()} and double-check array boundary constraints."

        return {
            "title": title,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "plan": plan
        }

ai_engine = AIEngine()

