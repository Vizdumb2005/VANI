"""Language identification layer (IndicLID stand-in).

Production design (design.md §2.1): AI4Bharat IndicLID precedes ASR so the
correct decoding path is chosen without asking the citizen anything.
This module implements the same interface with a deterministic script +
marker-word detector for the 3 demo languages. It never uses a user-declared
language field.
"""
import re

DEVANAGARI = re.compile(r"[\u0900-\u097F]")
TAMIL = re.compile(r"[\u0B80-\u0BFF]")

MR_MARKERS = {"आहे", "आहेत", "नाही", "येत", "मध्ये", "कडून", "पर्यंत", "त्रस्त", "वेधतो"}
HI_MARKERS = {"है", "हैं", "नहीं", "होती", "रहा", "रही", "हो", "गया", "गई", "दिलाता", "दिलाऊँ"}
TA_MARKERS = {"இருக்கு", "இல்ல", "வருது", "நடக்குது", "கவனத்துக்கு", "பண்ண", "மாவட்டம்"}


def detect_language(text: str) -> str:
    """Return ISO-639 code for the dominant language of `text`.

    Strategy: script ratio first (Tamil vs Devanagari), then hi/mr marker
    disambiguation within Devanagari. Falls back to 'hi' (demo languages).
    """
    t = str(text)
    n_dev = len(DEVANAGARI.findall(t))
    n_tam = len(TAMIL.findall(t))
    if n_tam > n_dev and n_tam > 0:
        return "ta"
    if n_dev > 0:
        words = {re.sub(r"[^\u0900-\u097F\u0B80-\u0BFFa-zA-Z0-9]", "", w) for w in t.split()}
        mr = len(words & MR_MARKERS)
        hi = len(words & HI_MARKERS)
        return "mr" if mr > hi else "hi"
    return "hi" if (n_dev + n_tam) > 0 else "other"
