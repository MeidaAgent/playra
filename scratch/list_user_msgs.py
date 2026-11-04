import json

with open(r'C:\Users\ArourL\.gemini\antigravity-ide\brain\286b5211-54b5-4ede-b74d-344473b58a53\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as fp:
    for line in fp:
        obj = json.loads(line)
        if obj.get('type') == 'USER_INPUT':
            content = obj.get('content', '')
            content = content.replace('\n', ' ')
            print(f"[{obj.get('step_index')}] {content[:120]}")
