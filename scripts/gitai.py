import subprocess
import os
import sys
import requests
import json
import re
from collections import defaultdict

# --- Configuration ---
DEFAULT_PROVIDER = "groq"
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-1.5-flash"
OPENROUTER_MODEL = "google/gemini-flash-1.5"

def get_env_var(name):
    """Load env var from system or .env files."""
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
        if len(content_diff) > 10000: content_diff = content_diff[:10000] + "\n... (diff truncated)"
        return files, content_diff
    except Exception as e:
        print(f"Error getting git diff: {e}")
        return None, None

def generate_commit_message(files, diff):
    provider = os.environ.get("GIT_AI_PROVIDER", DEFAULT_PROVIDER).lower()
    prompt = f"""Tu es un expert Git. Rédige un message de commit professionnel (français) suivant la convention Conventional Commits (feat:, fix:, refactor:, chore:, docs:) pour les changements suivants :
FICHIERS: {files}
RÉSUMÉ: {diff}
Réponds UNIQUEMENT avec le message du commit, sans guillemets."""

    try:
        if provider == "groq":
            api_key = get_env_var("GROQ_API_KEY")
            if not api_key: return "feat: update multiple files (Groq API Key missing)"
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            data = {"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0.3}
            res = requests.post(url, headers=headers, json=data)
            return res.json()['choices'][0]['message']['content'].strip()
        elif provider == "gemini":
            api_key = get_env_var("GEMINI_API_KEY")
            if not api_key: return "feat: update multiple files (Gemini API Key missing)"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
            res = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            return res.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        elif provider == "openrouter":
            api_key = get_env_var("OPENROUTER_API_KEY")
            if not api_key: return "feat: update multiple files (OpenRouter API Key missing)"
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            res = requests.post(url, headers=headers, json={"model": OPENROUTER_MODEL, "messages": [{"role": "user", "content": prompt}]})
            return res.json()['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"API Error: {e}")
    return None

def group_changes():
    # Get both staged and unstaged/untracked files
    status = subprocess.check_output(['git', 'status', '--porcelain'], text=True, encoding='utf-8').splitlines()
    groups = defaultdict(list)
    for line in status:
        if not line: continue
        path = line[3:].strip().strip('"')

        # Categorization logic
        if 'apps/api/src/modules/commerce' in path or 'payment' in path or 'paystack' in path:
            groups['Commerce & Payment'].append(path)
        elif 'apps/api/src/modules/copilot' in path or 'copilotStore' in path or 'components/copilot' in path:
            groups['AI Copilot'].append(path)
        elif 'apps/web/src/features/orders' in path:
            groups['Order Management'].append(path)
        elif 'apps/web/src/features/shop' in path or 'PublicShop' in path:
            groups['Storefront & Shop'].append(path)
        elif 'apps/web/src/features/settings' in path or 'SettingsPage' in path:
            groups['Settings & Profile'].append(path)
        elif 'apps/web/src/features/products' in path or 'product.model' in path:
            groups['Product Management'].append(path)
        elif 'apps/api/src/modules/whatsapp' in path or 'whatsapp.service' in path:
            groups['WhatsApp Module'].append(path)
        elif 'apps/web/src/components/layout' in path or 'AppLayout' in path or 'ShellHeader' in path:
            groups['UI Layout'].append(path)
        elif 'MEMORY.md' in path or 'doc/' in path or 'README' in path:
            groups['Documentation'].append(path)
        elif 'scripts/' in path:
            groups['Automation & Scripts'].append(path)
        else:
            groups['General / Misc'].append(path)
    return groups

def run_grouped_commits(dry_run=False):
    groups = group_changes()
    if not groups:
        print("Aucun changement détecté.")
        return

    # Unstage everything first to control the groups
    subprocess.run(['git', 'reset'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for name, files in groups.items():
        print(f"\n[Groupe : {name}]")
        # Stage only files in this group
        for f in files:
            subprocess.run(['git', 'add', f], stderr=subprocess.DEVNULL)

        staged_files, diff = get_staged_diff()
        if not staged_files:
            continue

        print(f"Génération du message pour {len(files)} fichier(s)...")
        msg = generate_commit_message(staged_files, diff)

        if msg:
            msg = msg.strip('"').strip("'")
            print(f"Message IA : {msg}")
            if not dry_run:
                subprocess.run(['git', 'commit', '-m', msg], check=True)
            else:
                print("[Mode Dry-Run] Le commit ne sera pas effectué.")
        else:
            print("Erreur lors de la génération du message.")
            # Unstage the group if failed
            subprocess.run(['git', 'reset'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    dry_run = "--dry-run" in sys.argv
    if "--grouped" in sys.argv:
        run_grouped_commits(dry_run)
    else:
        if "--add-all" in sys.argv:
            subprocess.run(['git', 'add', '.'], check=True)
        files, diff = get_staged_diff()
        if not files:
            print("Aucun fichier indexé. Utilisez 'git add' ou --add-all.")
            return
        msg = generate_commit_message(files, diff)
        if msg:
            msg = msg.strip('"').strip("'")
            print(f"\nMessage : {msg}")
            if not dry_run:
                subprocess.run(['git', 'commit', '-m', msg], check=True)
        else:
            print("Erreur lors de la génération du message.")

if __name__ == "__main__":
    main()
