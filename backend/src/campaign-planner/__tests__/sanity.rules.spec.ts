import { getSanityWarnings } from '../rules/sanity.rules';

describe('sanity rules', () => {
  it('warns when max_reach over-allocates video', () => {
    const warnings = getSanityWarnings('max_reach', {
      video: 0.4,
      display: 0.3,
      social: 0.3
    });

    expect(warnings.length).toBeGreaterThan(0);
  });

  it('warns when max_engagement under-allocates video', () => {
    const warnings = getSanityWarnings('max_engagement', {
      video: 0.3,
      display: 0.35,
      social: 0.35
    });

    expect(warnings.length).toBeGreaterThan(0);
  });
});
