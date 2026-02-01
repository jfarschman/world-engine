export function resolveKankaMentions(text: string | null) {
  if (!text) return '';
  
  // ROBUST REGEX: Handles mixed brackets [..] and [[..]]
  // (?:\[\[|\[)  -> Matches [ or [[
  // (?:\]\]|\])  -> Matches ] or ]]
  const ROBUST_REGEX = /(?:\[\[|\[)\s*(\w+):(\d+)(?:\|([^\]]+))?(?:\]\]|\])/g;

  return text.replace(ROBUST_REGEX, (match, type, id, label) => {
    let displayName = '';

    if (label) {
      // Handles "OldName|NewAlias" -> returns "NewAlias"
      const parts = label.split('|');
      displayName = parts[parts.length - 1].trim();
    } else {
      displayName = `${type.charAt(0).toUpperCase() + type.slice(1)} #${id}`;
    }
    
    return `<a href="/entity/${id}" class="text-blue-600 hover:underline font-semibold" title="${type} #${id}">${displayName}</a>`;
  });
}

export function stripKankaMentions(text: string | null) {
  if (!text) return '';
  // Regex to catch [type:id|Label] or [type:id]
  const REGEX = /(?:\[\[|\[)\s*(\w+):(\d+)(?:\|([^\]]+))?(?:\]\]|\])/g;

  return text.replace(REGEX, (match, type, id, label) => {
    // If there is a label (e.g. Calliope), use it.
    if (label) {
      const parts = label.split('|');
      return parts[parts.length - 1].trim();
    } 
    // If no label, fallback to "Type #ID"
    return `${type.charAt(0).toUpperCase() + type.slice(1)} #${id}`;
  });
}