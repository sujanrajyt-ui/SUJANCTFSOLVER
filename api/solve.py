from flask import Flask, request, jsonify
import os, httpx

app = Flask(__name__)

SYSTEM_PROMPT = (
    "You are SUJANSCTFSOLVER - an elite AI CTF solver. "
    "Solve CTF challenges with step-by-step reasoning. "
    "When you find the flag, output it as: FLAG: flag{...}"
)

PROVIDER_CONFIGS = {
    'openrouter': {
        'base_url': 'https://openrouter.ai/api/v1',
        'default_model': 'meta-llama/llama-3.3-70b-instruct:free',
        'env_key': 'OPENROUTER_API_KEY',
    },
    'groq': {
        'base_url': 'https://api.groq.com/openai/v1',
        'default_model': 'llama-3.3-70b-versatile',
        'env_key': 'GROQ_API_KEY',
    },
    'gemini': {
        'base_url': 'https://generativelanguage.googleapis.com/v1beta',
        'default_model': 'gemini-2.0-flash',
        'env_key': 'GEMINI_API_KEY',
    },
    'openai': {
        'base_url': 'https://api.openai.com/v1',
        'default_model': 'gpt-4o-mini',
        'env_key': 'OPENAI_API_KEY',
    },
}

@app.route('/', methods=['GET', 'POST'])
def solve():
    if request.method == 'GET':
        return jsonify({
            'endpoint': '/api/solve',
            'method': 'POST',
            'body': {
                'problem': 'CTF challenge text',
                'provider': 'openrouter|groq|gemini|openai',
                'model': 'optional model override',
            }
        })

    data = request.get_json(silent=True) or {}
    problem = (data.get('problem') or '').strip()
    provider_name = (data.get('provider') or 'openrouter').strip().lower()
    model_override = (data.get('model') or '').strip()

    if not problem:
        return jsonify({'success': False, 'error': 'problem is required'}), 400

    config = PROVIDER_CONFIGS.get(provider_name)
    if not config:
        return jsonify({'success': False, 'error': f'unknown provider: {provider_name}'}), 400

    api_key = os.environ.get(config['env_key']) or ''
    if not api_key:
        return jsonify({
            'success': False,
            'error': f'{config["env_key"]} not configured. Contact the site owner to add it.'
        }), 501

    model = model_override or config['default_model']

    try:
        if provider_name == 'gemini':
            result = call_gemini(api_key, config, model, problem)
        else:
            result = call_chat(api_key, config, model, problem)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


def call_chat(api_key, config, model, problem):
    url = f"{config['base_url']}/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }
    if 'openrouter' in str.lower(url):
        headers['HTTP-Referer'] = 'https://sujanctfsolver.vercel.app'
        headers['X-Title'] = 'SUJANSCTFSOLVER'

    body = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': problem},
        ],
        'max_tokens': 8192,
        'temperature': 0.2,
    }

    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=body)
        data = resp.json()

    if resp.status_code != 200:
        err = data.get('error', {})
        return {'success': False, 'error': err.get('message', str(data))}

    content = (data.get('choices') or [{}])[0].get('message', {}).get('content', '')
    return {'success': True, 'content': content, 'provider': provider_for_url(url), 'model': model}


def call_gemini(api_key, config, model, problem):
    url = f"{config['base_url']}/models/{model}:generateContent?key={api_key}"
    body = {
        'contents': [{
            'parts': [{'text': f"{SYSTEM_PROMPT}\n\n--- PROBLEM ---\n\n{problem}\n\n--- SOLUTION ---"}]
        }],
        'safetySettings': [
            {'category': c, 'threshold': 'BLOCK_NONE'}
            for c in ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH',
                       'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        ],
        'generationConfig': {'maxOutputTokens': 8192, 'temperature': 0.2},
    }

    with httpx.Client(timeout=90) as client:
        resp = client.post(url, json=body)
        data = resp.json()

    if resp.status_code != 200:
        err = data.get('error', {})
        return {'success': False, 'error': err.get('message', str(data))}

    parts = (data.get('candidates') or [{}])[0].get('content', {}).get('parts', [{}])
    content = parts[0].get('text', '') if parts else ''

    if not content:
        reason = (data.get('candidates') or [{}])[0].get('finishReason', 'unknown')
        return {'success': False, 'error': f'No response (reason: {reason})'}

    return {'success': True, 'content': content, 'provider': 'gemini', 'model': model}


def provider_for_url(url):
    if 'openrouter' in url: return 'openrouter'
    if 'groq' in url: return 'groq'
    if 'openai' in url: return 'openai'
    return 'unknown'
