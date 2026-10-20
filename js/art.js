/* Ilustrações SVG das peças, geradas a partir do campo `art` do produto.
   Substituídas automaticamente por foto quando o produto tem image_url. */
(function () {
  let uid = 0;

  function rgb(hex) { const n = parseInt(String(hex || '#777777').slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function shade(hex, amt) {
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const c = rgb(hex).map(v => Math.round((t - v) * p + v));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function isLight(hex) { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55; }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function fabric(id, color, pattern) {
    const hi = isLight(color) ? shade(color, -0.3) : shade(color, 0.38);
    if (pattern === 'pin') return `<pattern id="${id}" width="7" height="10" patternUnits="userSpaceOnUse"><rect width="7" height="10" fill="${color}"/><line x1="3.5" y1="0" x2="3.5" y2="10" stroke="${hi}" stroke-width=".55" stroke-dasharray="1.3 .7"/></pattern>`;
    if (pattern === 'check') return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${color}"/><path d="M0 12h24M12 0v24" stroke="${shade(color, -0.22)}" stroke-width="3" opacity=".45"/><path d="M0 3.5h24M0 5.5h24M3.5 0v24M5.5 0v24" stroke="${shade(color, -0.3)}" stroke-width=".6"/><path d="M0 18h24M18 0v24" stroke="#5C7499" stroke-width=".5" opacity=".8"/></pattern>`;
    if (pattern === 'linen') return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${color}"/><path d="M0 1.5h6M0 4.3h3.5M1.5 0v6M4.6 2v4" stroke="${shade(color, -0.1)}" stroke-width=".45"/><path d="M3 0v2" stroke="${shade(color, 0.15)}" stroke-width=".4"/></pattern>`;
    return `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${color}"/><path d="M0 4L4 0" stroke="${shade(color, isLight(color) ? -0.05 : 0.06)}" stroke-width=".5"/></pattern>`;
  }

  function silk(id, color, pattern, accent) {
    const a = accent || shade(color, 0.6);
    if (pattern === 'dots') return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${color}"/><circle cx="2.5" cy="2.5" r="1.15" fill="${a}"/><circle cx="7.5" cy="7.5" r="1.15" fill="${a}"/></pattern>`;
    if (pattern === 'stripes') return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="14" height="14" fill="${color}"/><rect y="0" width="14" height="3.2" fill="${a}"/><rect y="5.6" width="14" height="1" fill="${shade(color, 0.3)}"/></pattern>`;
    if (pattern === 'knit') return `<pattern id="${id}" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="3" fill="${color}"/><path d="M0 1.5h4" stroke="${shade(color, -0.28)}" stroke-width=".8"/><path d="M2 0v3" stroke="${shade(color, 0.14)}" stroke-width=".35"/></pattern>`;
    if (pattern === 'paisley') return `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${color}"/><path d="M6 3c4.5 0 6.5 4.5 4.2 7.6-2 2.7-6.4 2.6-6.4-1 0-2 1.8-3 3-2.2" fill="none" stroke="${a}" stroke-width="1.2"/><circle cx="7.4" cy="8.6" r="1.2" fill="${a}"/><circle cx="16.5" cy="16" r="2.4" fill="none" stroke="${a}" stroke-width=".8"/><circle cx="17" cy="5" r=".9" fill="${shade(color, 0.45)}"/><circle cx="4" cy="17" r=".9" fill="${shade(color, 0.45)}"/></pattern>`;
    return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${color}"/><path d="M0 5L5 0" stroke="${shade(color, 0.09)}" stroke-width=".6"/></pattern>`;
  }

  function wrap(inner, defs, title) {
    return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}"><defs>${defs}</defs>${inner}</svg>`;
  }

  function suit(a, title) {
    const id = 'a' + (++uid), F = `url(#f${id})`, T = `url(#t${id})`;
    const color = a.color || '#1E2A47';
    const edge = shade(color, isLight(color) ? -0.35 : -0.45);
    const shirt = a.shirt || '#F5F4F0';
    const satin = a.lapel === 'shawl' ? shade(color, 0.16) : null;
    let defs = fabric('f' + id, color, a.pattern) + silk('t' + id, a.tie || '#7A1F2B', a.tiePattern, a.accent);
    defs += `<linearGradient id="g${id}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
    if (satin) defs += `<linearGradient id="s${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${shade(satin, 0.25)}"/><stop offset=".55" stop-color="${satin}"/><stop offset="1" stop-color="${shade(satin, -0.2)}"/></linearGradient>`;

    const lapels = {
      notch: 'M82 40 L62 68 L71 74 L60 84 L99 124 L100 120 Z',
      peak: 'M82 40 L58 64 L48 52 L55 84 L99 124 L100 120 Z',
      shawl: 'M82 40 C54 64 58 96 99 124 L100 120 Z'
    };
    const lap = lapels[a.lapel] || lapels.notch;
    const lapFill = satin ? `url(#s${id})` : F;
    const tie = a.tieKind === 'bow'
      ? `<path d="M100 51 L85 44 Q82 51 85 58 Z M100 51 L115 44 Q118 51 115 58 Z" fill="${a.tie || '#0B0B0E'}"/><rect x="96" y="47" width="8" height="8" rx="2" fill="${shade(a.tie || '#0B0B0E', 0.15)}"/>`
      : `<path d="M95 49 L105 49 L103.5 59 L96.5 59 Z" fill="${T}"/><path d="M96.5 59 L103.5 59 L108 112 L100 121 L92 112 Z" fill="${T}"/><path d="M96.5 59 L100 59 L100 121 L92 112 Z" fill="#000" opacity=".08"/>`;
    const buttons = a.lapel === 'shawl'
      ? `<circle cx="100" cy="140" r="3" fill="${satin}"/>`
      : `<circle cx="100" cy="140" r="2.6" fill="${edge}"/><circle cx="100" cy="166" r="2.6" fill="${edge}"/>`;
    const square = a.square
      ? `<path d="M124 96 L128 86 L132 94 L136 84 L140 95 Z" fill="${a.lapel === 'shawl' ? '#F4F3EF' : (a.squareColor || '#F4F3EF')}"/>`
      : '';

    return wrap(`
      <path d="M30 58 L10 120 L7 228 L35 228 L41 122 Z" fill="${F}"/><path d="M170 58 L190 120 L193 228 L165 228 L159 122 Z" fill="${F}"/>
      <path d="M30 58 L10 120 L7 228 L35 228 L41 122 Z M170 58 L190 120 L193 228 L165 228 L159 122 Z" fill="#000" opacity=".18"/>
      <circle cx="16" cy="218" r="1.6" fill="${edge}"/><circle cx="22" cy="219" r="1.6" fill="${edge}"/><circle cx="184" cy="218" r="1.6" fill="${edge}"/><circle cx="178" cy="219" r="1.6" fill="${edge}"/>
      <path d="M82 40 L100 120 L118 40 Q100 33 82 40 Z" fill="${shirt}"/>
      ${tie}
      <path d="M85 37 L98 53 L91 30 Z M115 37 L102 53 L109 30 Z" fill="${shirt}" stroke="#000" stroke-opacity=".12" stroke-width=".6"/>
      <path d="M30 58 Q58 44 82 40 L100 120 L118 40 Q142 44 170 58 L168 232 L32 232 Z" fill="${F}"/>
      <path d="M30 58 Q58 44 82 40 L100 120 L118 40 Q142 44 170 58 L168 232 L32 232 Z" fill="url(#g${id})"/>
      <path d="M100 120 L100 232" stroke="${edge}" stroke-width=".8"/>
      <path d="${lap}" fill="${lapFill}" stroke="${edge}" stroke-width=".8"/>
      <path d="${lap}" fill="${lapFill}" stroke="${edge}" stroke-width=".8" transform="translate(200 0) scale(-1 1)"/>
      ${square}
      <path d="M122 96 L144 93" stroke="${edge}" stroke-width="1.2"/>
      <path d="M42 178 h34 M124 178 h34" stroke="${edge}" stroke-width="1.2"/><path d="M42 178 v6 h34 v-6 M124 178 v6 h34 v-6" fill="none" stroke="${edge}" stroke-width=".6" opacity=".7"/>
      ${buttons}`, defs, title);
  }

  function tieArt(a, title) {
    const id = 'a' + (++uid), T = `url(#t${id})`;
    const knit = a.pattern === 'knit';
    const blade = knit ? 'M93 46 L107 46 L117 214 L83 214 Z' : 'M92 46 L108 46 L124 200 L100 226 L76 200 Z';
    return wrap(`<g transform="rotate(-7 100 120)">
      <path d="M86 16 L114 16 L109 46 L91 46 Z" fill="${T}"/><path d="M86 16 L114 16 L109 46 L91 46 Z" fill="#000" opacity=".12"/>
      <path d="${blade}" fill="${T}"/>
      <path d="${knit ? 'M93 46 L100 46 L100 214 L83 214 Z' : 'M92 46 L100 46 L100 226 L76 200 Z'}" fill="#fff" opacity=".06"/>
      <path d="M100 52 L100 ${knit ? 214 : 226}" stroke="#000" stroke-opacity=".08" stroke-width=".6"/></g>`,
      silk('t' + id, a.color, a.pattern, a.accent), title);
  }

  function bowArt(a, title) {
    const c = a.color || '#141418', id = 'a' + (++uid);
    return wrap(`<g transform="translate(0 4)">
      <path d="M100 120 C82 96 50 88 40 102 C34 112 34 128 40 138 C50 152 82 144 100 120 Z" fill="url(#b${id})"/>
      <path d="M100 120 C118 96 150 88 160 102 C166 112 166 128 160 138 C150 152 118 144 100 120 Z" fill="url(#b${id})"/>
      <path d="M100 120 C86 108 62 104 52 112" stroke="#fff" stroke-opacity=".12" fill="none"/><path d="M100 120 C114 108 138 104 148 112" stroke="#fff" stroke-opacity=".12" fill="none"/>
      <rect x="90" y="104" width="20" height="32" rx="6" fill="${shade(c, 0.12)}"/></g>`,
      `<linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, 0.22)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, 0.1)}"/></linearGradient>`, title);
  }

  function squareArt(a, title) {
    const c = a.color, acc = a.accent || shade(c, -0.3);
    return wrap(`<path d="M100 34 L168 102 L100 170 L32 102 Z" fill="${c}"/>
      <path d="M100 44 L158 102 L100 160 L42 102 Z" fill="none" stroke="${acc}" stroke-width="1.4"/>
      <path d="M100 34 L100 170" stroke="#000" stroke-opacity=".1"/><path d="M32 102 L168 102" stroke="#000" stroke-opacity=".07"/>
      <path d="M100 34 L168 102 L100 102 Z" fill="#000" opacity=".06"/>
      <ellipse cx="100" cy="196" rx="54" ry="5" fill="#000" opacity=".08"/>`, '', title);
  }

  function cufflinksArt(a, title) {
    const id = 'a' + (++uid), c = a.color;
    const one = (x, y) => `<rect x="${x - 3}" y="${y + 24}" width="6" height="22" rx="2" fill="${shade(c, -0.25)}"/><rect x="${x - 12}" y="${y + 44}" width="24" height="7" rx="3.5" fill="${shade(c, -0.15)}"/>
      <circle cx="${x}" cy="${y}" r="28" fill="url(#m${id})"/><circle cx="${x}" cy="${y}" r="23" fill="none" stroke="${shade(c, -0.2)}" stroke-width="1"/><ellipse cx="${x - 9}" cy="${y - 10}" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 ${x - 9} ${y - 10})"/>`;
    return wrap(one(72, 92) + one(130, 128),
      `<radialGradient id="m${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${shade(c, 0.5)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.3)}"/></radialGradient>`, title);
  }

  function clipArt(a, title) {
    const id = 'a' + (++uid), c = a.color;
    return wrap(`<g transform="rotate(-12 100 120)">
      <path d="M30 108 L168 108 Q174 108 174 114 L174 120 Q174 126 168 126 L30 126 Z" fill="url(#k${id})"/>
      <path d="M30 108 Q20 108 20 117 Q20 126 30 126 L36 126 Q28 126 28 117 Q28 108 36 108 Z" fill="${shade(c, -0.25)}"/>
      <path d="M36 113 L160 113" stroke="#fff" stroke-opacity=".35"/>
      <path d="M40 132 L150 132" stroke="#000" stroke-opacity=".08" stroke-width="3"/></g>`,
      `<linearGradient id="k${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, 0.35)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.2)}"/></linearGradient>`, title);
  }

  window.LapelaArt = {
    svg(art, title) {
      const a = art || {};
      switch (a.kind) {
        case 'tie': return tieArt(a, title);
        case 'bow': return bowArt(a, title);
        case 'square': return squareArt(a, title);
        case 'cufflinks': return cufflinksArt(a, title);
        case 'clip': return clipArt(a, title);
        default: return suit(a, title);
      }
    }
  };
})();
