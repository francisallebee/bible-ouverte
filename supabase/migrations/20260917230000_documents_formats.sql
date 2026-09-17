-- Le seau `documents` accepte, outre le PDF, les formats qu'on sait lire en
-- HTML riche depuis le 17 septembre 2026 au soir : EPUB, Word (.docx),
-- OpenDocument (.odt), HTML. Le lecteur les convertit dans le navigateur
-- (`lib/documents/unites.ts`) et les rend dans un Shadow DOM assaini ; le
-- seau n'a qu'à les garder. Même plafond de 20 Mo, mêmes policies.

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'text/html'
]
where id = 'documents';
