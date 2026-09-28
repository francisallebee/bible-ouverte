import { describe, it, expect } from 'vitest';
import { datesDuCochage } from './cochage';

describe('datesDuCochage', () => {
  it('un plan daté coché en retard enregistre la lecture aujourd’hui, pas au jour prévu', () => {
    // Le ticket 32 : jour 6 d'« Un proverbe par jour », prévu le 9, coché le 28.
    expect(datesDuCochage(false, '2026-09-28')).toEqual({ lecture: '2026-09-28', jour: null });
  });

  it('un plan daté coché en avance n’enregistre pas une lecture dans le futur', () => {
    expect(datesDuCochage(false, '2026-09-28').lecture).toBe('2026-09-28');
  });

  it('le calendrier d’un plan daté ne bouge pas : `jour` est nul', () => {
    expect(datesDuCochage(false, '2026-09-28').jour).toBeNull();
  });

  it('un plan libre prend la date saisie, pour la lecture comme pour le jour', () => {
    expect(datesDuCochage(true, '2026-09-28', '2026-09-25')).toEqual({
      lecture: '2026-09-25', jour: '2026-09-25',
    });
  });

  it('un plan libre sans date saisie prend aujourd’hui', () => {
    expect(datesDuCochage(true, '2026-09-28')).toEqual({ lecture: '2026-09-28', jour: '2026-09-28' });
    expect(datesDuCochage(true, '2026-09-28', '')).toEqual({ lecture: '2026-09-28', jour: '2026-09-28' });
  });

  it('la date saisie d’un plan daté est ignorée : il ne la demande pas', () => {
    expect(datesDuCochage(false, '2026-09-28', '2026-09-09')).toEqual({
      lecture: '2026-09-28', jour: null,
    });
  });
});
