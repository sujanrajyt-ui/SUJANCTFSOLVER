from flask import Flask, jsonify
from pathlib import Path

app = Flask(__name__)

ROOT = Path(__file__).resolve().parent.parent

@app.route('/')
def index():
    return jsonify({
        'service': 'SUJANSCTFSOLVER API',
        'version': '1.0.0',
        'endpoints': {
            'GET /api/': 'This page',
            'POST /api/solve': 'AI solver proxy (problem + provider → solution)',
            'POST /api/classify': 'CTF challenge classification',
        }
    })

@app.route('/api/')
def api_root():
    return index()
