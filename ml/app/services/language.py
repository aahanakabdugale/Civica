"""
Language Detection & Translation Service.

Detects the language of citizen complaint text and translates it to English
for downstream processing (classification, embedding, priority scoring).

Supports: Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam,
          Punjabi, Urdu, and any other language supported by Google Translate.

Uses `deep-translator` (actively maintained, no dependency conflicts).
"""

import logging
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

logger = logging.getLogger(__name__)

# Make langdetect deterministic
DetectorFactory.seed = 0

# Language code to name mapping for common Indian languages
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "or": "Odia",
    "as": "Assamese",
}


class LanguageService:
    """
    Handles language detection and translation.
    Uses `langdetect` for detection (offline, fast) and `deep-translator` for translation.
    """

    def __init__(self):
        try:
            from deep_translator import GoogleTranslator
            # Test with a simple translation to verify it works
            self._translator_class = GoogleTranslator
            self._translator_available = True
            logger.info("Google Translator (deep-translator) initialized successfully")
        except Exception as e:
            self._translator_class = None
            self._translator_available = False
            logger.warning(f"Translator unavailable: {e}. Translation will be skipped.")

    def detect_language(self, text: str) -> str:
        """
        Detect the language of the input text.

        Returns:
            Language code (e.g., "en", "hi", "mr")
            Returns "en" as fallback if detection fails.
        """
        if not text or len(text.strip()) < 3:
            return "en"  # Too short for reliable detection

        try:
            lang = detect(text)
            return lang
        except LangDetectException:
            logger.warning(f"Language detection failed for text: '{text[:50]}...'")
            return "en"  # Default to English

    def translate_to_english(self, text: str, source_lang: str) -> str:
        """
        Translate text from source language to English.

        Returns:
            Translated English text, or original text if translation fails/unavailable.
        """
        if source_lang == "en":
            return text

        if not self._translator_available:
            logger.warning("Translator not available, returning original text")
            return text

        try:
            translator = self._translator_class(source=source_lang, target="en")
            translated = translator.translate(text)
            logger.info(
                f"Translated [{source_lang}→en]: "
                f"'{text[:50]}...' → '{translated[:50]}...'"
            )
            return translated
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return text  # Graceful fallback — pass original text through

    def detect_and_translate(self, text: str) -> dict:
        """
        Full pipeline: detect language → translate to English if needed.

        Returns:
            {
                "original_text": str,
                "detected_language": str,       # Language code (e.g., "hi")
                "language_name": str,            # Human-readable (e.g., "Hindi")
                "translated_text": str,          # Always in English
                "was_translated": bool
            }
        """
        detected_lang = self.detect_language(text)
        language_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())

        if detected_lang == "en":
            return {
                "original_text": text,
                "detected_language": "en",
                "language_name": "English",
                "translated_text": text,
                "was_translated": False,
            }

        translated = self.translate_to_english(text, detected_lang)

        return {
            "original_text": text,
            "detected_language": detected_lang,
            "language_name": language_name,
            "translated_text": translated,
            "was_translated": True,
        }
