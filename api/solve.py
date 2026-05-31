from flask import Flask, request, jsonify
import os, httpx, json

app = Flask(__name__)

SYSTEM_PROMPT = (
    "You are SUJANSCTFSOLVER - an elite AI CTF solver. "
    "Solve CTF challenges with step-by-step reasoning. "
    "When you find the flag, output it as: FLAG: flag{...}"
)

PROVIDER_CONFIGS = {
    'openrouter': {
        'base_url': 'https://openrouter.ai/api/v1',
        'models': {
            'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct:free',
            'deepseek-r1': 'deepseek/deepseek-r1',
            'deepseek-v3': 'deepseek/deepseek-chat',
            'hermes-405b': 'nousresearch/hermes-3-llama-3.1-405b:free',
            'qwen-coder': 'qwen/qwen3-coder:free',
        },
        'default_model': 'meta-llama/llama-3.3-70b-instruct:free',
        'env_key': 'OPENROUTER_API_KEY',
    },
    'groq': {
        'base_url': 'https://api.groq.com/openai/v1',
        'models': {
            'llama-3.3-70b': 'llama-3.3-70b-versatile',
            'mixtral': 'mixtral-8x7b-32768',
            'gemma2': 'gemma2-9b-it',
        },
        'default_model': 'llama-3.3-70b-versatile',
        'env_key': 'GROQ_API_KEY',
    },
    'gemini': {
        'base_url': 'https://generativelanguage.googleapis.com/v1beta',
        'models': {
            'gemini-2.0-flash': 'gemini-2.0-flash',
            'gemini-2.5-pro': 'gemini-2.5-pro-exp-03-25',
        },
        'default_model': 'gemini-2.0-flash',
        'env_key': 'GEMINI_API_KEY',
    },
    'openai': {
        'base_url': 'https://api.openai.com/v1',
        'models': {
            'gpt-4o-mini': 'gpt-4o-mini',
            'gpt-4o': 'gpt-4o',
        },
        'default_model': 'gpt-4o-mini',
        'env_key': 'OPENAI_API_KEY',
    },
}

@app.route('/', methods=['GET', 'POST'])
def handle():
    return solve()

@app.route('/api/solve', methods=['GET', 'POST'])
def solve():
    if request.method == 'GET':
        return jsonify({'endpoint': '/api/solve', 'method': 'POST', 'body': {'problem': '...', 'provider': 'openrouter|groq|gemini|openai', 'model': '...'}})

    data = request.get_json(silent=True) or {}
    problem = (data.get('problem') or '').strip()
    provider_name = (data.get('provider') or 'openrouter').strip().lower()
    model_key = (data.get('model') or '').strip()

    if not problem:
        return jsonify({'success': False, 'error': 'problem is required'}), 400

    config = PROVIDER_CONFIGS.get(provider_name)
    if not config:
        return jsonify({'success': False, 'error': f'unknown provider: {provider_name}'}), 400

    api_key = os.environ.get(config['env_key']) or ''
    if not api_key:
        return jsonify({'success': False, 'error': f'{config["env_key"]} not configured on server'}), 501

    model = model_key or config['default_model']
    if provider_name == 'openrouter':
        model = config['models'].get(model, model)

    if provider_name == 'gemini':
        result = call_gemini(api_key, config, model, problem)
    else:
        result = call_chat_completion(api_key, config, model, problem)

    return jsonify(result)


def call_chat_completion(api_key, config, model, problem):
    url = f"{config['base_url']}/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }
    if 'openrouter' in url:
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

    try:
        with httpx.Client(timeout=120) as client:
            resp = client.post(url, headers=headers, json=body)
            data = resp.json()
        if resp.status_code != 200:
            err = data.get('error', {})
            return {'success': False, 'error': err.get('message', str(data))}
        content = (data.get('choices') or [{}])[0].get('message', {}).get('content', '')
        return {'success': True, 'content': content, 'provider': 'openrouter' if 'openrouter' in url else 'groq' if 'groq' in url else 'openai', 'model': model}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def call_gemini(api_key, config, model, problem):
    url = f"{config['base_url']}/models/{model}:generateContent?key={api_key}"
    body = {
        'contents': [{
            'parts': [{'text': f"{SYSTEM_PROMPT}\n\n--- CTF PROBLEM ---\n\n{problem}\n\n--- RESPONSE ---"}]
        }],
        'safetySettings': [
            {'category': c, 'threshold': 'BLOCK_NONE'}
            for c in ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH',
                       'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        ],
        'generationConfig': {'maxOutputTokens': 8192, 'temperature': 0.2},
    }

    try:
        with httpx.Client(timeout=90) as client:
            resp = client.post(url, json=body)
            data = resp.json()
        if resp.status_code != 200:
            err = data.get('error', {})
            return {'success': False, 'error': err.get('message', str(data))}
        content = (data.get('candidates') or [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not content:
            block_reason = (data.get('candidates') or [{}])[0].get('finishReason', 'unknown')
            return {'success': False, 'error': f'Blocked: {block_reason}'}
        return {'success': True, 'content': content, 'provider': 'gemini', 'model': model}
    except Exception as e:
        return {'success': False, 'error': str(e)}
