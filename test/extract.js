// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Yong Cong Sin <yongcong.sin@gmail.com>
// Extract positioned text from moomoo statement PDFs, as the page does.
//   node extract.js <pdf dir> <out.json>   (out.json is private: keep it outside the repo)
const fs = require("fs");
const path = require("path");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

(async () => {
  const [dir, out] = process.argv.slice(2);
  const statements = [];
  for (const f of fs.readdirSync(dir).filter((f) => /\.pdf$/i.test(f)).sort()) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, f))), disableFontFace: true, isEvalSupported: false, verbosity: 0 }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      pages.push(content.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: it.height || Math.abs(it.transform[3]) })));
    }
    statements.push({ id: f, pages });
  }
  fs.writeFileSync(out, JSON.stringify(statements));
  console.log(`extracted ${statements.length} statements`);
})();
