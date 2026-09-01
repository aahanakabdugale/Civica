"""
Text preprocessing utilities.
Cleans and normalizes raw citizen complaint text before embedding/classification.
"""

import re


def clean_text(text: str) -> str:
    """
    Basic text normalization pipeline:
    1. Collapse excessive whitespace
    2. Strip leading/trailing whitespace
    3. Remove non-useful special characters (keep punctuation)
    4. Truncate to 2000 chars (LLM context + embedding efficiency)
    """
    if not text:
        return ""

    # Collapse multiple whitespace (including newlines) into single space
    text = re.sub(r'\s+', ' ', text).strip()

    # Remove control characters and unusual symbols, but preserve:
    # - All Unicode letters and digits (\w covers these)
    # - All Unicode combining marks (vowel matras in Hindi, etc.)
    # - Useful punctuation and currency symbols
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Remove repeated punctuation (e.g. "!!!!!!" → "!")
    text = re.sub(r'([!?.])\1+', r'\1', text)

    # Truncate long texts
    if len(text) > 2000:
        text = text[:2000].rsplit(' ', 1)[0]  # Break at word boundary

    return text


def extract_keywords(text: str) -> list[str]:
    """
    Extract individual lowercase words from text.
    Useful for keyword-based fallback classification and priority scoring.
    """
    text_lower = text.lower()
    # Split on non-alphanumeric characters
    words = re.findall(r'[a-z]+', text_lower)
    return words


def truncate_for_display(text: str, max_length: int = 100) -> str:
    """Truncate text for log messages and display, adding ellipsis if needed."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3].rsplit(' ', 1)[0] + "..."
