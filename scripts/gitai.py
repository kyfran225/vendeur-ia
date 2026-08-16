import subprocess
import os
import sys
import requests
import json

# --- Configuration ---
DEFAULT_PROVIDER = "groq"
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-1.5-flash"
OPENROUTER_MODEL = "google/gemini-flash-1.5"

def get_env_var(name):
    val = os.environ.get(name)
    if val: return val
    try:
        root_dir = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True, encoding='utf-8').strip()
        paths = [os.path.join(root_dir, '.env.local'), os.path.join(root_dir, 'apps', 'api', '.env')]
        for path in paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith(f"{name}="):
                            return line.split('=', 1)[1].strip().strip('"').strip("'")
    except: pass
    return None

def get_staged_diff():
    try:
        files = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], text=True, encoding='utf-8').strip()
        if not files: return None, None
        diff = subprocess.check_output(['git', 'diff', '--cached', '--stat'], text=True, encoding='utf-8').strip()
        content_diff = subprocess.check_output(['git', 'diff', '--cached', '-U1'], text=True, encoding='utf-8')
        if len(content_diff) > 15000: content_diff = content_diff[:15000] + "\n... (diff truncated)"
        return files, content_diff
    except Exception as e:
        print(f"Error getting git diff: {e}")
        return None, None

def generate_commit_message(files, diff):
    provider = os.environ.get("GIT_AI_PROVIDER", DEFAULT_PROVIDER).lower()
    prompt = f"""Tu es un expert Git. Rédige un message de commit professionnel en Français (Conventional Commits) pour ces changements :
FILES: {files}
SUMMARY: {diff}
Réponds UNIQUEMENT avec le message (ex: feat: description), sans guillemets."""

    try:
        if provider == "groq":
            api_key = get_env_var("GROQ_API_KEY")
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}"}
            data = {"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0.2}
            res = requests.post(url, headers=headers, json=data, timeout=30)
            json_res = res.json()
            if 'choices' in json_res:
                return json_res['choices'][0]['message']['content'].strip()
            print(f"Groq API Error: {res.text}")
        elif provider == "gemini":
            api_key = get_env_var("GEMINI_API_KEY")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
            res = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=30)
            return res.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        elif provider == "openrouter":
            api_key = get_env_var("OPENROUTER_API_KEY")
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}"}
            res = requests.post(url, headers=headers, json={"model": OPENROUTER_MODEL, "messages": [{"role": "user", "content": prompt}]}, timeout=30)
            return res.json()['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"API Error: {e}")
    return None

def main():
    dry_run = "--dry-run" in sys.argv
    if "--add-all" in sys.argv:
        subprocess.run(['git', 'add', '.'], check=True)

    files, diff = get_staged_diff()
    if not files:
        print("Aucun changement indexé (staged). Utilisez 'git add' ou --add-all.")
        return

    print("Analyse des changements...")
    msg = generate_commit_message(files, diff)
    if msg:
        msg = msg.strip('"').strip("'")
        print(f"\nMessage proposé :\n------------------\n{msg}\n------------------")
        if not dry_run:
            subprocess.run(['git', 'commit', '-m', msg], check=True)
            print("Commit effectué avec succès.")
    else:
        print("Échec de la génération du message.")

if __name__ == "__main__":
    main()
