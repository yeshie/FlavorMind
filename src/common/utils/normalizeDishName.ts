const DEFAULT_DISH_NAME = 'Suggested Dish';

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const stripWrappingQuotes = (value: string) =>
  value.replace(/^["'`]+|["'`]+$/g, '').trim();

const removeRepeatedWords = (value: string) =>
  value.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');

const normalizeKnownConflations = (value: string, query?: string) => {
  const lower = value.toLowerCase();
  const hasKiriHodi = /kiri\s*hodi/.test(lower);
  const hasChickenCurry = /chicken\s+curry/.test(lower);

  if (hasKiriHodi && hasChickenCurry) {
    const queryLower = (query || '').toLowerCase();
    if (/kiri\s*hodi/.test(queryLower)) {
      return 'Kiri Hodi';
    }
    if (/chicken\s+curry/.test(queryLower)) {
      return 'Chicken Curry (Sri Lankan)';
    }
    return lower.indexOf('kiri hodi') < lower.indexOf('chicken curry')
      ? 'Kiri Hodi'
      : 'Chicken Curry (Sri Lankan)';
  }

  return value;
};

const shortenIfOverlyLong = (value: string) => {
  if (value.length <= 60) {
    return value;
  }

  const split = value.split(/\s[-–—:;,|]\s/);
  if (split.length > 1 && split[0].trim().length >= 6) {
    return split[0].trim();
  }

  return value;
};

export const normalizeDishName = (rawName?: string, query?: string) => {
  if (!rawName) {
    return DEFAULT_DISH_NAME;
  }

  let name = rawName.replace(/[\r\n]+/g, ' ');
  name = collapseWhitespace(name);
  name = stripWrappingQuotes(name);
  name = removeRepeatedWords(name);
  name = normalizeKnownConflations(name, query);
  name = shortenIfOverlyLong(name);

  return name || DEFAULT_DISH_NAME;
};

