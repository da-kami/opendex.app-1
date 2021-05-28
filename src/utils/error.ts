/**
 *
 * @returns message value if argument is an Error
 * @returns the input value if argument is a string
 * @returns an empty string in other cases
 */
export const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') {
    return err;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return '';
};
