#!/usr/bin/env python3
"""Convert OSIS JSON from heb12/gratis.json to the app's bundled JSON format."""

import json
import sys
import urllib.request

OSIS_TO_APP = {
    'Gen': 'GEN', 'Exod': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deut': 'DEU',
    'Josh': 'JOS', 'Judg': 'JDG', 'Ruth': 'RUT',
    '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI',
    '1Chr': '1CH', '2Chr': '2CH', 'Ezra': 'EZR', 'Neh': 'NEH',
    'Esth': 'EST', 'Job': 'JOB', 'Ps': 'PSA', 'Prov': 'PRO',
    'Eccl': 'ECC', 'Song': 'SNG', 'Isa': 'ISA', 'Jer': 'JER',
    'Lam': 'LAM', 'Ezek': 'EZK', 'Dan': 'DAN',
    'Hos': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obad': 'OBA',
    'Jonah': 'JON', 'Mic': 'MIC', 'Nah': 'NAM', 'Hab': 'HAB',
    'Zeph': 'ZEP', 'Hag': 'HAG', 'Zech': 'ZEC', 'Mal': 'MAL',
    'Matt': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
    'Acts': 'ACT', 'Rom': 'ROM',
    '1Cor': '1CO', '2Cor': '2CO', 'Gal': 'GAL', 'Eph': 'EPH',
    'Phil': 'PHP', 'Col': 'COL', '1Thess': '1TH', '2Thess': '2TH',
    '1Tim': '1TI', '2Tim': '2TI', 'Titus': 'TIT', 'Phlm': 'PHM',
    'Heb': 'HEB', 'Jas': 'JAS', '1Pet': '1PE', '2Pet': '2PE',
    '1John': '1JN', '2John': '2JN', '3John': '3JN', 'Jude': 'JUD',
    'Rev': 'REV',
}

APP_BOOK_NAMES = {
    'GEN': 'Genèse', 'EXO': 'Exode', 'LEV': 'Lévitique', 'NUM': 'Nombres',
    'DEU': 'Deutéronome', 'JOS': 'Josué', 'JDG': 'Juges', 'RUT': 'Ruth',
    '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Rois', '2KI': '2 Rois',
    '1CH': '1 Chroniques', '2CH': '2 Chroniques', 'EZR': 'Esdras',
    'NEH': 'Néhémie', 'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psaumes',
    'PRO': 'Proverbes', 'ECC': 'Ecclésiaste', 'SNG': 'Cantique des Cantiques',
    'ISA': 'Ésaïe', 'JER': 'Jérémie', 'LAM': 'Lamentations', 'EZK': 'Ézéchiel',
    'DAN': 'Daniel', 'HOS': 'Osée', 'JOL': 'Joël', 'AMO': 'Amos',
    'OBA': 'Abdias', 'JON': 'Jonas', 'MIC': 'Michée', 'NAM': 'Nahum',
    'HAB': 'Habacuc', 'ZEP': 'Sophonie', 'HAG': 'Aggée', 'ZEC': 'Zacharie',
    'MAL': 'Malachie', 'MAT': 'Matthieu', 'MRK': 'Marc', 'LUK': 'Luc',
    'JHN': 'Jean', 'ACT': 'Actes', 'ROM': 'Romains', '1CO': '1 Corinthiens',
    '2CO': '2 Corinthiens', 'GAL': 'Galates', 'EPH': 'Éphésiens',
    'PHP': 'Philippiens', 'COL': 'Colossiens', '1TH': '1 Thessaloniciens',
    '2TH': '2 Thessaloniciens', '1TI': '1 Timothée', '2TI': '2 Timothée',
    'TIT': 'Tite', 'PHM': 'Philémon', 'HEB': 'Hébreux', 'JAS': 'Jacques',
    '1PE': '1 Pierre', '2PE': '2 Pierre', '1JN': '1 Jean', '2JN': '2 Jean',
    '3JN': '3 Jean', 'JUD': 'Jude', 'REV': 'Apocalypse',
}


def fetch_osis(url: str) -> dict:
    print(f'  Downloading {url}...')
    with urllib.request.urlopen(url) as f:
        return json.loads(f.read().decode('utf-8'))


def convert_osis_to_app(data: dict, version_id: str, version_name: str) -> dict:
    osis_text = data['osis']['osisText']
    books_in = osis_text['div']

    books_out = []
    for book in books_in:
        osis_id = book['osisID']
        app_abbr = OSIS_TO_APP.get(osis_id)
        if app_abbr is None:
            print(f'  WARNING: Unknown OSIS book ID "{osis_id}", skipping')
            continue

        chapters_in = book['chapter']
        if isinstance(chapters_in, dict):
            chapters_in = [chapters_in]
        chapters_out = []
        for ch in chapters_in:
            if isinstance(ch, str):
                continue
            ch_num = ch.get('chapter') or int(ch['osisID'].split('.')[-1])
            verses_in = ch.get('verse', [])
            if isinstance(verses_in, dict):
                verses_in = [verses_in]
            verses_out = []
            for v in verses_in:
                if isinstance(v, dict):
                    v = [v]
                if isinstance(v, list) and len(v) >= 2:
                    meta = v[0]
                    text_parts = [str(t).strip() for t in v[1:] if isinstance(t, str)]
                    text = ' '.join(text_parts)
                    if isinstance(meta, dict) and 'osisID' in meta:
                        verse_num = int(meta['osisID'].rsplit('.', 1)[-1])
                    else:
                        verse_num = 0
                    if verse_num > 0 and text:
                        verses_out.append({'verse': verse_num, 'text': text})
            if verses_out:
                chapters_out.append({'chapter': ch_num, 'verses': verses_out})

        if chapters_out:
            books_out.append({
                'abbreviation': app_abbr,
                'name': APP_BOOK_NAMES.get(app_abbr, app_abbr),
                'chapters': chapters_out,
            })

    return {
        'id': version_id,
        'name': version_name,
        'language': 'fr',
        'copyrightStatus': 'public-domain',
        'source': 'bundled',
        'books': books_out,
    }


def main():
    versions = [
        ('cramp23', 'Augustin Crampon 1923',
         'https://raw.githubusercontent.com/heb12/gratis.json/master/fr/cramp23.json'),
        ('sacc', 'Lemaître de Sacy 1667',
         'https://raw.githubusercontent.com/heb12/gratis.json/master/fr/sacc.json'),
    ]

    for version_id, version_name, url in versions:
        print(f'Converting {version_name} ({version_id})...')
        data = fetch_osis(url)
        app_data = convert_osis_to_app(data, version_id, version_name)
        books = app_data['books']
        total_verses = sum(
            sum(len(c['verses']) for c in b['chapters'])
            for b in books
        )
        print(f'  Books: {len(books)}, Total verses: {total_verses}')

        out_path = f'src/data/bibles/{version_id}.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(app_data, f, ensure_ascii=False, indent=2)
        print(f'  Saved to {out_path}')

    print('Done!')


if __name__ == '__main__':
    main()
