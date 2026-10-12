const { parseJson } = require('./parse');

const parseSizeChart = (raw) => {
  const parsed = parseJson(raw, null);
  if (!parsed || !parsed.type || !Array.isArray(parsed.columns) || !Array.isArray(parsed.rows)) return null;

  const columns = parsed.columns.map((column) => String(column).trim()).filter(Boolean);
  const rows = parsed.rows
    .filter((row) => row && typeof row.size === 'string' && row.size.trim())
    .map((row) => ({
      size: row.size.trim(),
      measurements: Object.fromEntries(
        columns.map((column) => [
          column,
          row.measurements && row.measurements[column] != null ? String(row.measurements[column]).trim() : '',
        ])
      ),
    }));

  return {
    type: ['upper', 'lower', 'custom'].includes(parsed.type) ? parsed.type : 'custom',
    unit: parsed.unit ? String(parsed.unit).trim() : 'inches',
    columns,
    rows,
  };
};

const parseColors = (raw) => {
  const parsed = parseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((color) => color && color.name)
    .map((color) => ({ name: String(color.name).trim(), hex: color.hex ? String(color.hex).trim() : '' }));
};

module.exports = { parseSizeChart, parseColors };
