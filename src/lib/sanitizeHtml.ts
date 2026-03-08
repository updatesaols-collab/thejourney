const SCRIPT_STYLE_BLOCKS =
  /<(script|style|iframe|object|embed|form|meta|link)[\s\S]*?>[\s\S]*?<\/\1>/gi;

const INLINE_EVENT_HANDLER = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;

const JAVASCRIPT_URI = /\s(href|src)\s*=\s*("|\')\s*javascript:[^"']*\2/gi;

const DATA_URI = /\s(href|src)\s*=\s*("|\')\s*data:[^"']*\2/gi;

export const sanitizeRichHtml = (value: string) => {
  if (!value) return "";
  return value
    .replace(SCRIPT_STYLE_BLOCKS, "")
    .replace(INLINE_EVENT_HANDLER, "")
    .replace(JAVASCRIPT_URI, "")
    .replace(DATA_URI, "")
    .trim();
};

