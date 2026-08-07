/**
 * Markdown -> HTML mínimo, sin dependencias externas, pensado solo para
 * la sección "Sobre mí" (item #21): subtítulos, listas con viñetas,
 * listas numeradas, negrita/cursiva, enlaces y párrafos. No es un
 * markdown completo (no maneja tablas, código, etc.) a propósito: es
 * contenido que solo escribe el admin, así que alcanza y sobra.
 *
 * Se escapa el HTML de entrada primero, así que aunque el admin pegue
 * texto raro no se puede inyectar HTML/JS desde acá — el único lugar
 * con poder real es el campo de CSS personalizado, que se inserta
 * aparte en un <style> (ver about-css.tsx).
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // Enlaces [texto](https://...) — solo http(s), nunca javascript:
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Negrita **texto** o __texto__
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // Cursiva *texto* o _texto_
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");
  return out;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  function closeParagraph() {
    if (paragraph.length > 0) {
      html.push(`<p>${paragraph.join(" ")}</p>`);
      paragraph = [];
    }
  }

  function closeList() {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      closeParagraph();
      closeList();
      continue;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.*)$/);
    if (headingMatch) {
      closeParagraph();
      closeList();
      const level = headingMatch[1].length; // 2, 3 o 4
      html.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      closeParagraph();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(bulletMatch[1])}</li>`);
      continue;
    }

    const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (numberedMatch) {
      closeParagraph();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(numberedMatch[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(inline(line));
  }

  closeParagraph();
  closeList();

  return html.join("\n");
}
