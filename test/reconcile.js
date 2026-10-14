// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Yong Cong Sin <yongcong.sin@gmail.com>
// Every account must land exactly on each statement value (per-currency net
// asset value less funds, and each fund's value), via the balance-only and
// trade-log exports. Also fails on any parser warning or unrecognised row.
//   node reconcile.js <extracted.json>
const fs = require("fs");
const P = require("../src/parser.js");
const E = require("../src/export.js");

const statements = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const r = P.parseStatements(statements);
let bad = 0;
const fail = (msg) => { console.log("BAD " + msg); bad++; };
if (r.errors.length) fail(`errors: ${JSON.stringify(r.errors)}`);
if (r.warnings.length) fail(`warnings: ${r.warnings.join("; ")}`);
if (r.skippedRows.some((x) => x.category === "unknown")) fail("unrecognised rows: " + JSON.stringify(r.skippedRows.filter((x) => x.category === "unknown")));
console.log(`${r.months.length} statements, accounts: ${Object.keys(r.accounts).length}, skipped: ${JSON.stringify(r.skipped)}`);
const earliest = r.months[0].month;
for (const [name, a] of Object.entries(r.accounts)) {
  for (const withTrades of [false, true]) {
    const { entries, problems } = E.adjustedEntries(a, null, null, earliest, withTrades);
    const start = E.openingBalance(a, null, null, earliest, entries);
    let worst = 0;
    for (const [d, v] of a.valuations) {
      const bal = start.balance + entries.filter((e) => e.date <= d).reduce((s, e) => s - e.amount, 0);
      worst = Math.max(worst, Math.abs(Math.round(bal * 100) / 100 - v));
    }
    const tradeLines = entries.filter((e) => e.kind === "trade").length;
    const ok = worst < 0.005 && !problems.length && (!withTrades || a.kind !== "investment" || tradeLines === a.trades.length);
    if (!ok) fail(`${name} ${withTrades ? "trade log" : "balance only"}: max diff ${worst.toFixed(2)} ${problems.join("; ")}`);
    else if (!withTrades) console.log(`OK  ${name} (${a.kind}): ${a.valuations.length} month-ends, ${entries.length} rows, ${a.trades.length} trades, starts ${start.balance} on ${start.date}`);
  }
}
console.log(bad ? `${bad} problems` : "every month-end matches the statement");
process.exit(bad ? 1 : 0);
