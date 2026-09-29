import { describe, it, expect } from 'vitest'
import { numeroDuVerset } from './numerotation'

const v = (chapter: number, verse: number) => ({ chapter, verse })

describe('numeroDuVerset', () => {
  it('« verset » rend le numéro seul, quel que soit le chapitre', () => {
    expect(numeroDuVerset(v(3, 16), v(3, 16), 'verset')).toBe('16')
    expect(numeroDuVerset(v(4, 1), v(3, 16), 'verset')).toBe('1')
  })

  it('« aucune » ne rend rien', () => {
    expect(numeroDuVerset(v(3, 16), v(3, 16), 'aucune')).toBeNull()
  })

  it('« depuis-le-debut » : le premier verset porte son numéro seul', () => {
    expect(numeroDuVerset(v(3, 16), v(3, 16), 'depuis-le-debut')).toBe('16')
  })

  it('« depuis-le-debut » : tous les autres portent chapitre:verset, même dans le même chapitre', () => {
    // Le comportement livré, gardé tel quel par le refactoring du 29 septembre.
    expect(numeroDuVerset(v(3, 17), v(3, 16), 'depuis-le-debut')).toBe('3:17')
    expect(numeroDuVerset(v(4, 1), v(3, 16), 'depuis-le-debut')).toBe('4:1')
  })

  it('« depuis-le-debut » sans point de départ retombe sur le verset seul', () => {
    expect(numeroDuVerset(v(4, 1), undefined, 'depuis-le-debut')).toBe('1')
  })
})
