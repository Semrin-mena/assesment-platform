from openai import OpenAI
from flask import current_app

MODEL = "gpt-4o"

VARIANT_CONFIGS = {
    "A": {
        "temperature": 0.3,
        "system": (
            "You are a precise, senior software engineer. "
            "Write clean, minimal, and well-structured code. "
            "Focus on correctness, readability, and best practices."
        ),
    },
    "B": {
        "temperature": 0.7,
        "system": (
            "You are a creative programmer who explores alternative approaches. "
            "Consider different patterns, data structures, or algorithms. "
            "Provide a working solution that may differ from the conventional approach."
        ),
    },
}


def generate_pair(prompt_text):
    """Call the OpenAI API twice with different configs to produce two distinct responses."""
    api_key = current_app.config["OPENAI_API_KEY"]
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=api_key)
    results = {}

    for variant, config in VARIANT_CONFIGS.items():
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=2048,
            temperature=config["temperature"],
            messages=[
                {"role": "system", "content": config["system"]},
                {"role": "user", "content": prompt_text},
            ],
        )
        results[variant] = {
            "text": response.choices[0].message.content,
            "config": config,
        }

    return results
