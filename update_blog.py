import json, datetime, sys, os

html_content = sys.argv[1]
ind_layers = json.loads(sys.argv[2])
spec_levels = json.loads(sys.argv[3])
comp_levels = json.loads(sys.argv[4])
try:
    scenarios = json.loads(sys.argv[5])
except IndexError:
    scenarios = []

posts_file = "/root/.openclaw/workspace/github_deploy/posts.js"
if not os.path.exists(posts_file):
    os.makedirs(os.path.dirname(posts_file), exist_ok=True)
    with open(posts_file, 'w') as f:
        f.write("window.POSTS_DATA = [];")

with open(posts_file, 'r') as f:
    content = f.read()

prefix = "window.POSTS_DATA = "
data_str = content[len(prefix):].strip()
if data_str.endswith(";"): data_str = data_str[:-1]
try:
    posts = json.loads(data_str)
except Exception:
    posts = []

new_id = max([p.get('id', 0) for p in posts] + [0]) + 1
new_post = {
    "id": new_id,
    "date": datetime.datetime.now().strftime("%d.%m.%Y"),
    "html_content": html_content,
    "industry_layers": ind_layers,
    "specialist_levels": spec_levels,
    "company_levels": comp_levels,
    "scenarios": scenarios
}

posts.insert(0, new_post)

with open(posts_file, 'w') as f:
    f.write(prefix + json.dumps(posts, ensure_ascii=False, indent=2) + ";")
