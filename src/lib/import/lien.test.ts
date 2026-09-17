import { describe, it, expect } from 'vitest'
import { adresseAdmise, nomDeFichierPour } from './lien'

describe('adresseAdmise', () => {
  it.each([
    'https://example.org/culte.docx',
    'http://www.example.org/',
    ' https://example.org/notes?x=1 ',
  ])('%s passe, normalisée', (u) => {
    const r = adresseAdmise(u)
    expect('url' in r && r.url.startsWith('http')).toBe(true)
  })

  it.each([
    ['pas une adresse', 'adresse-invalide'],
    ['ftp://example.org/x', 'adresse-invalide'],
    ['file:///etc/passwd', 'adresse-invalide'],
    ['https://user:mdp@example.org/', 'adresse-invalide'],
    ['http://localhost:3000/admin', 'adresse-interne'],
    ['http://app.localhost/', 'adresse-interne'],
    ['http://127.0.0.1/', 'adresse-interne'],
    ['http://10.0.0.8/', 'adresse-interne'],
    ['http://172.16.5.4/', 'adresse-interne'],
    ['http://192.168.1.46/', 'adresse-interne'],
    ['http://169.254.169.254/latest/meta-data', 'adresse-interne'],
    ['http://[::1]/', 'adresse-interne'],
    ['http://serveur.local/', 'adresse-interne'],
    ['http://base.internal/', 'adresse-interne'],
  ])('%s → %s', (u, refus) => {
    expect(adresseAdmise(u)).toEqual({ refus })
  })

  it('172.32 n’est pas privé, 172.16 à 172.31 le sont', () => {
    expect('url' in adresseAdmise('http://172.32.0.1/')).toBe(true)
    expect(adresseAdmise('http://172.31.255.255/')).toEqual({ refus: 'adresse-interne' })
  })
})

describe('nomDeFichierPour', () => {
  it('garde le nom de l’adresse quand il porte une extension', () => {
    expect(nomDeFichierPour('https://x.org/docs/culte.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('culte.docx')
    expect(nomDeFichierPour('https://x.org/livre.epub', null)).toBe('livre.epub')
    expect(nomDeFichierPour('https://x.org/plan%20de%20lecture.txt', 'text/plain')).toBe('plan de lecture.txt')
  })
  it('une page sans chemin devient page.html', () => {
    expect(nomDeFichierPour('https://x.org/', 'text/html; charset=utf-8')).toBe('page.html')
  })
  it('un chemin sans extension prend celle du type', () => {
    expect(nomDeFichierPour('https://x.org/articles/culte', 'text/html')).toBe('culte.html')
    expect(nomDeFichierPour('https://x.org/dl/123', 'application/pdf')).toBe('123.pdf')
  })
  it('une adresse .php qui sert du HTML reste lisible comme HTML', () => {
    expect(nomDeFichierPour('https://x.org/index.php', 'text/html')).toBe('index.html')
  })
  it('un type inconnu qui n’est pas du texte finit en .bin — et sera dit « format non reconnu »', () => {
    expect(nomDeFichierPour('https://x.org/blob', 'application/octet-stream')).toBe('blob.bin')
  })
})
