/**
 * Convert string to camelCase text.
 */
export function camelCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return (
    removeNonWord(str)
      // eslint-disable-next-line no-useless-escape
      .replace(/\-/g, ' ') //convert all hyphens to spaces
      .replace(/\s[a-z]/g, (s) => s.toUpperCase()) //convert first char of each word to UPPERCASE
      .replace(/\s+/g, '') //remove spaces
      .replace(/^[A-Z]/g, (s) => s.toLowerCase())
  ); //convert first char to lowercase
}

/**
 * Add space between camelCase text.
 */
export function unCamelCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Insert space between consecutive uppercase letters followed by a lowercase letter
    .toLowerCase(); // Convert the entire string to lowercase
  // return str.replace(/([A-Z\xC0-\xDF])/g, ' $1').toLowerCase(); //add space between camelCase text
}

/**
 * UPPERCASE first char of each word.
 */
export function titleCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return unCamelCase(str)
    .toLowerCase()
    .replace(/^[\wæøå]|\s[\wæøå]|\s/gi, (s) => s.toUpperCase());
}

/**
 * camelCase + UPPERCASE first char
 */
export function pascalCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return camelCase(str).replace(/^[a-z]/, (s) => s.toUpperCase());
}

/**
 * UPPERCASE first char of each sentence and lowercase other chars.
 */
export function sentenceCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  // Replace first char of each sentence (new line or after '.\s+') to
  // UPPERCASE
  return unCamelCase(str)
    .toLowerCase()
    .replace(/(^\w)|\.\s+(\w)/gm, (s) => s.toUpperCase());
}

/**
 * Convert to lower case, remove accents, remove non-word chars and
 * replace spaces with the specified delimiter.
 * Does not split camelCase text.
 */
export function slugify(str: string, delimiter = '-'): string {
  if (!str || typeof str !== 'string') return str;
  return removeNonWord(str)
    .trim() //should come after removeNonWord
    .replace(/ +/g, delimiter) //replace spaces with delimiter
    .toLowerCase();
}

/**
 * Replaces spaces with hyphens, split camelCase text, remove non-word chars, remove accents and convert to lower case.
 */
export function hyphenate(str: string): string {
  if (!str || typeof str !== 'string') return str;
  str = unCamelCase(str);
  return slugify(str, '-');
}

/**
 * Replaces hyphens with spaces. (only hyphens between word chars)
 */
export function unhyphenate(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/(\w)(-)(\w)/g, '$1 $3');
}

/**
 * Replaces spaces with underscores, split camelCase text, remove
 * non-word chars, remove accents and convert to lower case.
 */
export function underscore(str: string): string {
  if (!str || typeof str !== 'string') return str;
  str = unCamelCase(str);
  return slugify(str, '_');
}

/**
 * Remove non-word chars.
 */
export function removeNonWord(str: string): string {
  if (!str || typeof str !== 'string') return str;
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[^0-9a-zA-Z\xC0-\xFF \-]/g, '');
}
