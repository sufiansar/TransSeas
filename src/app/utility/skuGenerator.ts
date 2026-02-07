const clean = (text: string) =>
  text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .slice(0, 2)
    .join("");

const randomCode = (length = 4) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();

export const generateSKU = (
  productName: string,
  size?: string,
  type = "STD"
) => {
  const namePart = clean(productName);
  const sizePart = size ? size.toUpperCase() : "NA";

  return `${namePart}-${type}-${sizePart}-${randomCode()}`;
};
