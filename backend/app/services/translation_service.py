import logging
from typing import Tuple
# pyrefly: ignore [missing-import]
from deep_translator import GoogleTranslator

logger = logging.getLogger("civica.translation")

class TranslationService:
    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='en')

    def translate_and_detect(self, text: str) -> Tuple[str, str]:
        """
        Translates text to English if needed.
        Returns: (translated_text, detected_language)
        """
        if not text or not text.strip():
            return text, "en"
            
        clean_text = text.strip()
        
        # Simple ASCII heuristic for quick English detection
        is_ascii = all(ord(char) < 128 for char in clean_text)
        if is_ascii:
            return clean_text, "en"

        try:
            translated = self.translator.translate(clean_text)
            if translated:
                # Sanitize rate-limit or HTML error pages from web scrapers
                is_error_response = any(err_marker in translated.lower() for err_marker in ["error 500", "server error", "<html", "429 too many", "that's an error"])
                if is_error_response:
                    logger.warning(f"Translation returned web error scraper page. Falling back to original text.")
                    return clean_text, "en"

                logger.info(f"Translated text from non-English to: '{translated[:50]}...'")
                return translated, "indic_auto"
            return clean_text, "en"
        except Exception as e:
            logger.warning(f"Translation failed ({str(e)}). Falling back to raw text.")
            return clean_text, "en"

translation_service = TranslationService()
