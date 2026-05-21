import { filterFragrances } from '../lib/filter-fragrances';

type Fragrance = {
  id: string;
  brand: string;
  name: string;
  phase: 1 | 2 | 3;
  temperature: string;
  lean: string;
  anosmia_risk: 'High' | 'Medium' | 'Low';
  rating: number | null;
};

const makeFragrances = (): Fragrance[] => {
  const base: Fragrance[] = [
    {
      id: 'cold-masculine-high',
      brand: 'Brand A',
      name: 'Cold Masculine High',
      phase: 1,
      temperature: 'Cold',
      lean: 'Masculine',
      anosmia_risk: 'High',
      rating: 9,
    },
    {
      id: 'cold-masculine-low',
      brand: 'Brand B',
      name: 'Cold Masculine Low',
      phase: 1,
      temperature: 'Cold',
      lean: 'Masculine',
      anosmia_risk: 'Low',
      rating: 8,
    },
    {
      id: 'cold-feminine-low',
      brand: 'Brand C',
      name: 'Cold Feminine Low',
      phase: 2,
      temperature: 'Cold',
      lean: 'Feminine',
      anosmia_risk: 'Low',
      rating: 7,
    },
    {
      id: 'warm-feminine-low',
      brand: 'Brand D',
      name: 'Warm Feminine Low',
      phase: 2,
      temperature: 'Warm',
      lean: 'Feminine',
      anosmia_risk: 'Low',
      rating: null,
    },
    {
      id: 'warm-unisex-medium',
      brand: 'Brand E',
      name: 'Warm Unisex Medium',
      phase: 3,
      temperature: 'Warm',
      lean: 'Unisex',
      anosmia_risk: 'Medium',
      rating: 6,
    },
    {
      id: 'hot-masculine-high',
      brand: 'Brand F',
      name: 'Hot Masculine High',
      phase: 3,
      temperature: 'Hot',
      lean: 'Masculine',
      anosmia_risk: 'High',
      rating: 5,
    },
  ];

  const generated: Fragrance[] = Array.from({ length: 70 }, (_, index) => ({
    id: `generated-${index + 1}`,
    brand: `Generated Brand ${index + 1}`,
    name: `Generated Fragrance ${index + 1}`,
    phase: ((index % 3) + 1) as 1 | 2 | 3,
    temperature: 'All-season',
    lean: 'Unisex',
    anosmia_risk: 'Medium',
    rating: null,
  }));

  return [...base, ...generated];
};

describe('filterFragrances', () => {
  const fragrances = makeFragrances();

  test('no filters returns all 76 fragrances', () => {
    const result = filterFragrances(fragrances, {
      season: 'All',
      lean: 'All',
      anosmia: 'All',
    });

    expect(result).toHaveLength(76);
  });

  test('season Cold returns only Cold fragrances', () => {
    const result = filterFragrances(fragrances, {
      season: 'Cold',
      lean: 'All',
      anosmia: 'All',
    });

    expect(result).toHaveLength(3);
    expect(result.every((fragrance) => fragrance.temperature === 'Cold')).toBe(true);
  });

  test('lean Masculine plus season Cold returns the intersection', () => {
    const result = filterFragrances(fragrances, {
      season: 'Cold',
      lean: 'Masculine',
      anosmia: 'All',
    });

    expect(result.map((fragrance) => fragrance.id)).toEqual([
      'cold-masculine-high',
      'cold-masculine-low',
    ]);
  });

  test('anosmia High returns only High risk fragrances', () => {
    const result = filterFragrances(fragrances, {
      season: 'All',
      lean: 'All',
      anosmia: 'High',
    });

    expect(result).toHaveLength(2);
    expect(result.every((fragrance) => fragrance.anosmia_risk === 'High')).toBe(true);
  });

  test('anosmia Low plus lean Feminine returns the correct intersection', () => {
    const result = filterFragrances(fragrances, {
      season: 'All',
      lean: 'Feminine',
      anosmia: 'Low',
    });

    expect(result.map((fragrance) => fragrance.id)).toEqual([
      'cold-feminine-low',
      'warm-feminine-low',
    ]);
  });

  test('filter with no matches returns an empty array', () => {
    const result = filterFragrances(fragrances, {
      season: 'Hot',
      lean: 'Feminine',
      anosmia: 'High',
    });

    expect(result).toEqual([]);
  });

  test('all filters set to All returns all fragrances', () => {
    const result = filterFragrances(fragrances, {
      season: 'All',
      lean: 'All',
      anosmia: 'All',
    });

    expect(result).toEqual(fragrances);
    expect(result).toHaveLength(76);
  });
});
