import subprocess
import os
import sys
import requests
import json
import re

# --- Configuration ---
# You can override these in your .env.local
DEFAULT_PROVIDER = "groq" # or "gemini", "openrouter"
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-1.5-flash"
OPENROUTER_MODEL = "google/gemini-flash-1.5"

def get_env_var(name):
    """Load env var from system or .env.local"""
    val = os.environ.get(name)
    if val:
        return val

    # Try to find .env.local in root
    try:
        root_dir = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
        env_path = os.path.join(root_dir, '.env.local')
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith(f"{name}="):
                        return line.split('=', 1)[1].strip().strip('"').strip("'")

        # Also try apps/api/.env
        api_env_path = os.path.join(root_dir, 'apps', 'api', '.env')
        if os.path.exists(api_env_path):
             with open(api_env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith(f"{name}="):
                        return line.split('=', 1)[1].strip().strip('"').strip("'")
    except:
        pass
    return None

def get_staged_diff():
    try:
        # Get list of files
        files = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], text=True, encoding='utf-8').strip()
        if not files:
            return None, None

        # Get diff summary
        diff = subprocess.check_output(['git', 'diff', '--cached', '--stat'], text=True, encoding='utf-8').strip()
        # Get actual content diff (limited to avoid token limits)
        content_diff = subprocess.check_output(['git', 'diff', '--cached', '-U1'], text=True, encoding='utf-8')
        if len(content_diff) > 10000:
            content_diff = content_diff[:10000] + "\n... (diff truncated)"

        return files, content_diff
    except Exception as e:
        print(f"Error getting git diff: {e}")
        return None, None

def generate_commit_message(files, diff):
    provider = os.environ.get("GIT_AI_PROVIDER", DEFAULT_PROVIDER).lower()

    prompt = f"""Tu es un expert en Git. Rédige un message de commit concis et professionnel en Français pour les changements suivants.
Utilise la convention 'Conventional Commits' (ex: feat:, fix:, refactor:, chore:, docs:).
Sois précis mais bref. Ne fais pas de phrases d'introduction.

Fichiers modifiés :
{files}

Résumé des changements :
{diff}

Réponds uniquement avec le message du commit, sans guillemets."""

    if provider == "groq":
        api_key = get_env_var("GROQ_API_KEY")
        if not api_key:
            print("Error: GROQ_API_KEY not found.")
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        data = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        }
        res = requests.post(url, headers=headers, json=data)
        if res.status_code == 200:
            return res.json()['choices'][0]['message']['content'].strip()

    elif provider == "openrouter":
        api_key = get_env_var("OPENROUTER_API_KEY")
        if not api_key:
            print("Error: OPENROUTER_API_KEY not found.")
            return None

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://vendeur-ia.com",
            "Content-Type": "application/json"
        }
        data = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }
        res = requests.post(url, headers=headers, json=data)
        if res.status_code == 200:
            return res.json()['choices'][0]['message']['content'].strip()

    elif provider == "gemini":
        api_key = get_env_var("GEMINI_API_KEY")
        if not api_key:
            print("Error: GEMINI_API_KEY not found.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        res = requests.post(url, json=data)
        if res.status_code == 200:
            return res.json()['candidates'][0]['content']['parts'][0]['text'].strip()

    print(f"Error calling {provider} API: {res.text}")
    return None

def main():
    # Handle auto-add if requested
    if "--add-all" in sys.argv:
        print("Staging all changes...")
        subprocess.run(['git', 'add', '.'], check=True)
    elif "--add" in sys.argv:
        # Find the index of --add and take the next argument
        idx = sys.argv.index("--add")
        if idx + 1 < len(sys.argv):
            path = sys.argv[idx + 1]
            print(f"Staging {path}...")
            subprocess.run(['git', 'add', path], check=True)

    files, diff = get_staged_diff()
    if not files:
        print("No staged changes found. Use 'git add' or run with --add-all.")
        return

    print("Analyzing changes...")
    msg = generate_commit_message(files, diff)
    if not msg:
        print("Failed to generate commit message.")
        return

    # Remove surrounding quotes if AI added them
    msg = msg.strip('"').strip("'")

    print(f"\nProposed commit message:\n------------------\n{msg}\n------------------")

    # If not dry run, commit
    if "--dry-run" not in sys.argv:
        try:
            subprocess.run(['git', 'commit', '-m', msg], check=True)
            print("Successfully committed.")
        except subprocess.CalledProcessError:
            print("Git commit failed.")
    else:
        print("Dry run: not committing.")

if __name__ == "__main__":
    main()
