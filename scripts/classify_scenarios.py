#!/usr/bin/env python3
"""
Classify posts by scenarios (keyword-matching) and update posts.js.

Usage:
  python3 scripts/classify_scenarios.py
"""

import json
import re
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.parent
POSTS_JS = PROJECT_DIR / "sigismund-logs-main" / "posts.js"

SCENARIO_KEYWORDS = {
    "hardware": [
        r"gpu", r"cpu", r"железо", r"сервер(?!ны)", r"чип[а-я]*",
        r"vram", r"gguf", r"ggml", r"quant", r"quantiz", r"квант",
        r"apple.?silicon", r"metal", r"cuda", r"npu", r"tpu",
        r"экономи[яю]", r"стоимост", r"дешев",
        r"tensor.?parallel", r"макбук", r"macbook",
        r"rtx", r"a100", r"h100", r"ssd.*stream",
    ],
    "private-ai": [
        r"локальн", r"приватн", r"edge", r"ollama", r"llama\.cpp",
        r"vllm", r"privac", r"on.?premise", r"свой инференс",
        r"без.?облак", r"без.?api", r"офлайн", r"offline",
        r"self.?host", r"своём.*ноут", r"своем.*ноут",
        r"развернуть.*локальн", r"запустить.*локальн",
        r"mlx", r"koboldcpp", r"llamafile", r"local.*llm",
        r"слив.*данн", r"утечк.*данн",
    ],
    "ai-teams": [
        r"мульти.?агент", r"multi.?agent", r"swarm", r"роевой",
        r"оркестр", r"orchestr", r"crew.?ai", r"crewai",
        r"a2a", r"agent.?to.?agent", r"mcp", r"tool.?use",
        r"tool.?call", r"команд.*агент", r"агент.*команд",
        r"p2p.*agent", r"агент.*p2p", r"несколько.*агент",
        r"agents.*working", r"agent.*network",
        r"peer", r"supervisor", r"делегирован",
    ],
    "ai-knowledge": [
        r"\brag\b", r"fine.?tun", r"дообуч", r"файнтюн",
        r"embed", r"векторн", r"knowledge", r"retrieval",
        r"граф.*памят", r"graph.*memory", r"memory.*graph",
        r"знани.*бизнес", r"бизнес.*знани",
        r"обучени.*модел", r"модел.*обучени",
        r"training", r"трениров", r"датасет", r"dataset",
        r"lora", r"qlora", r"adapte?r",
        r"reinforcement", r"rl.*llm", r"rlhf", r"grpo", r"dpo",
    ],
    "autopilot": [
        r"автомат(?!ическ.*обнов)", r"automat",
        r"\bpipeline\b", r"пайплайн", r"триггер", r"trigger",
        r"no.?code", r"n8n", r"zapier", r"make\.com",
        r"workflow", r"конвейер", r"ci.?cd",
        r"автопилот", r"autopilot",
        r"бизнес.?процесс", r"процесс.*автом",
    ],
}

# Minimum keyword matches to classify into a scenario
MIN_MATCHES = 2


def classify_post(html_content: str) -> list:
    """Classify a post into scenarios by keyword matching."""
    text = html_content.lower()
    # Strip HTML tags for cleaner matching
    text_clean = re.sub(r'<[^>]+>', ' ', text)

    results = []
    for scenario, keywords in SCENARIO_KEYWORDS.items():
        matches = 0
        for kw in keywords:
            if re.search(kw, text_clean, re.IGNORECASE):
                matches += 1
        if matches >= MIN_MATCHES:
            results.append(scenario)

    # Fallback: if no scenario matched, try with MIN_MATCHES=1
    if not results:
        for scenario, keywords in SCENARIO_KEYWORDS.items():
            for kw in keywords:
                if re.search(kw, text_clean, re.IGNORECASE):
                    results.append(scenario)
                    break

    return results if results else ["autopilot"]  # default fallback


def main():
    # Read posts.js
    content = POSTS_JS.read_text("utf-8")

    # Extract JSON array from "window.POSTS_DATA = [...];"
    match = re.search(r'window\.POSTS_DATA\s*=\s*(\[.*\])\s*;', content, re.DOTALL)
    if not match:
        print("Error: could not parse posts.js")
        return

    posts = json.loads(match.group(1))
    print(f"Loaded {len(posts)} posts")

    # Classify each post
    scenario_counts = {}
    for post in posts:
        scenarios = classify_post(post.get("html_content", ""))
        post["scenarios"] = scenarios
        for s in scenarios:
            scenario_counts[s] = scenario_counts.get(s, 0) + 1

    # Write back
    js_content = "window.POSTS_DATA = " + json.dumps(posts, ensure_ascii=False, indent=2) + ";\n"
    POSTS_JS.write_text(js_content, "utf-8")

    print("\nScenario distribution:")
    for scenario, count in sorted(scenario_counts.items()):
        print(f"  {scenario}: {count} posts")

    # Show posts with no strong match
    no_match = [p for p in posts if p["scenarios"] == ["autopilot"] and "autopilot" not in
                [s for s, kws in SCENARIO_KEYWORDS.items()
                 if any(re.search(kw, re.sub(r'<[^>]+>', ' ', p.get("html_content", "").lower()))
                        for kw in kws)]]
    if no_match:
        print(f"\nPosts that defaulted to 'autopilot' (no keyword match):")
        for p in no_match:
            title = re.sub(r'<[^>]+>', '', p.get("html_content", ""))[:80]
            print(f"  #{p['id']}: {title}")


if __name__ == "__main__":
    main()
