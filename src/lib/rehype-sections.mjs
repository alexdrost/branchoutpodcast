const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Wraps the content following each <h2> in <section class="sec sec-{slug}">
 * so the stylesheet can treat "Notable moments", "Related episodes", and
 * "Transcript" differently without fragile string parsing of the markdown.
 */
export default function rehypeSections() {
  return (tree) => {
    const out = [];
    let current = null;
    for (const node of tree.children) {
      if (node.type === 'element' && node.tagName === 'h2') {
        if (current) out.push(current);
        const text = String(
          (node.children || []).map((c) => c.value || '').join('')
        );
        const id = slug(text);
        node.properties = { ...(node.properties || {}), id };
        current = {
          type: 'element',
          tagName: 'section',
          properties: { className: ['sec', `sec-${id}`] },
          children: [node],
        };
      } else if (current) {
        current.children.push(node);
      } else {
        out.push(node);
      }
    }
    if (current) out.push(current);
    tree.children = out;
  };
}
