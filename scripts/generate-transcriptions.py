import json
import re
from pathlib import Path

from phonikud import phonemize
from phonikud_onnx import Phonikud

INPUT = Path('/private/tmp/hebrew-transcription-input.json')
MODEL = Path('/private/tmp/phonikud-model/phonikud-1.0.int8.onnx')
OUTPUT = Path('transcriptions.js')


def ipa_to_russian(value: str) -> str:
    """Convert Phonikud's Modern Hebrew IPA to a readable Russian transcription."""
    replacements = [
        ('dʒ', 'дж'),
        ('tʃ', 'ч'),
        ('ts', 'ц'),
        ('ʃ', 'ш'),
        ('ʒ', 'ж'),
        ('χ', 'х'),
        ('x', 'х'),
        ('ʁ', 'р'),
        ('ɡ', 'г'),
        ('ʔ', ''),
        ('j', 'й'),
        ('w', 'у'),
        ('b', 'б'),
        ('v', 'в'),
        ('d', 'д'),
        ('h', 'х'),
        ('z', 'з'),
        ('t', 'т'),
        ('k', 'к'),
        ('l', 'л'),
        ('m', 'м'),
        ('n', 'н'),
        ('s', 'с'),
        ('f', 'ф'),
        ('p', 'п'),
        ('r', 'р'),
        ('g', 'г'),
        ('a', 'а'),
        ('e', 'е'),
        ('i', 'и'),
        ('o', 'о'),
        ('u', 'у'),
    ]
    result = value.lower()
    for source, target in replacements:
        result = result.replace(source, target)
    result = re.sub(r'\s+', ' ', result).strip()

    # Move Phonikud's stress marker onto the following vowel.
    vowels = 'аеиоу'
    chars = list(result)
    while 'ˈ' in chars:
        marker = chars.index('ˈ')
        chars.pop(marker)
        for index in range(marker, len(chars)):
            if chars[index] in vowels:
                chars[index] += '\u0301'
                break
    return ''.join(chars)


def main() -> None:
    payload = json.loads(INPUT.read_text())
    known = payload['known']
    model = Phonikud(str(MODEL))
    result = {}

    for index, text in enumerate(payload['hebrew'], start=1):
        if text in known:
            result[text] = known[text].translate(str.maketrans({
                'h': 'х', 'H': 'Х', 'a': 'а', 'A': 'А', 'e': 'е', 'E': 'Е',
                'i': 'и', 'I': 'И', 'o': 'о', 'O': 'О', 'u': 'у', 'U': 'У',
            }))
            continue
        try:
            vocalized = model.add_diacritics(text)
            result[text] = ipa_to_russian(phonemize(vocalized, schema='plain'))
        except Exception as error:
            print(f'Could not transcribe {text!r}: {error}')
            result[text] = ''
        if index % 250 == 0:
            print(f'Processed {index}/{len(payload["hebrew"])}')

    missing = [text for text, transcription in result.items() if not transcription]
    source = (
        '/* Generated locally with Phonikud; existing human transcriptions take priority. */\n'
        f'window.HEBREW_TRANSCRIPTIONS = {json.dumps(result, ensure_ascii=False, separators=(",", ":"))};\n'
    )
    OUTPUT.write_text(source)
    print(f'Wrote {len(result)} transcriptions to {OUTPUT}; missing: {len(missing)}')


if __name__ == '__main__':
    main()
