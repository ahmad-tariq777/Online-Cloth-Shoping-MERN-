const stripHtml = (value) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value);

const cleanText = (value) => (typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : '');

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactMatch = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i');

const containsMatch = (value) => new RegExp(escapeRegex(String(value).trim()), 'i');

const slugify = (value) =>
  String(value).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

module.exports = { stripHtml, cleanText, normalizeEmail, escapeHtml, escapeRegex, exactMatch, containsMatch, slugify };
