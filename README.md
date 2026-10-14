# moomoo2csv

Converts moomoo (Singapore) monthly account statement PDFs into CSV or QIF files for a personal
finance app.

**Use it at <https://ycsin.github.io/moomoo2csv/>**, or download `index.html` and open it
locally. Drop the PDFs, pick the months, download. It's one
self-contained file (pdf.js embedded, no network access); the PDFs never leave the browser.

**Unofficial, not affiliated with moomoo or Futu.** Check the results against your statements
before relying on them.

## Output

- **Securities & Cash**, one account per currency: the cash ledger (deposits, withdrawals,
  currency exchanges, dividends, coupons, withholding tax, fund subscriptions and
  redemptions) plus the stocks and ETFs held in that currency. Its value is the statement's
  net asset value for that currency less the funds.
- **Each fund** (money market, bond funds): subscriptions in from cash, redemptions out to
  cash. A subscription paid but not yet allotted at month end counts towards the fund.
- One switch at the top for all of them:
  - *Balance only* (default): the cash movements and a monthly *Returns (month-end
    adjustment)* row, so the running balance equals each statement's value
  - *Balance + trade log*: the same plus every buy/sell as a 0.00 line with quantity and price
  - *With holdings*: trades CSV (stock symbols; ISINs for funds), transactions CSV, month-end
    balances CSV
- Subscriptions and redemptions appear in both the cash account and the fund, as transfers.
- **QIF** per account (Balance only and trade log): the same transactions, including the
  monthly returns adjustments, starting with an *Opening Balance* record (the balance just
  before the first entry). Trade lines aren't included; With holdings has no QIF (QIF's bank
  format can't carry units and prices). QIF has no currency field, so import each file into an
  account of that currency. Dates are `YYYY-MM-DD`; name → payee (`P`), notes → memo (`M`).
- **Accounts CSV**: `Account type,Name,Balance,Currency,Balance Date` per exported account,
  with the balance just before the first exported entry.
- **Combined CSV**: all accounts in one file with a leading `account` column (multi-account
  imports; names match the Accounts CSV).

Columns: trades `date,ticker,qty,price,currency,name` (negative qty = sell); transactions
`date,amount,currency,name,notes` with inflows positive; month-end balances `date,balance,currency`.

Accounts are detected from the statements (securities and cash per currency, and each fund
you've held). The **Accounts** panel lets you rename an account, change its type, merge it
into another, or exclude it (saved in the browser).

## How it reads the PDFs

The parser works on positioned text: lines come from pdf.js fragments, cells are assigned to
the nearest table header, and cash-ledger cells, which sit a few points off their row, are
attached to the nearest dated row. Comments wrap above and below their row. Headings drawn
twice (fake bold) are de-duplicated. A ledger row without a usable comment is matched to the
fund trade with the same amount.

## Development

- `src/layout.js`: pdf.js text fragments → lines → table rows
- `src/parser.js`: statement parsing, accounts
- `src/export.js`: balance-only entries, starting balances, CSV formats
- `src/app.js`, `src/index.template.html`: the UI
- `vendor/`: pdf.js 3.11.174 (`pdf.min.js`, `pdf.worker.min.js`)
- `python3 build.py`: rebuilds `index.html` (inlines everything). Commit the result: GitHub
  Pages serves `index.html` as-is, and the *Build check* workflow fails if it's out of date.

Tests need your own statement PDFs and write private output (extracted statement text,
CSVs, screenshots); keep those outside the repo or in `test/out/`, which is git-ignored.
`cd test && npm install`, then:
- `node extract.js <pdf dir> out.json`: positioned text from the PDFs (private)
- `node reconcile.js out.json`: no warnings; every account export hits each statement's value
- `CHROME=<chrome-headless-shell> node e2e.js <pdf dir> <out dir>`: drive the page, save the zips
- `DUMP=out.json CHROME=... node config-e2e.js <pdf dir> <out dir>`: drive the Accounts panel

## License

Apache License 2.0, see [LICENSE](LICENSE). Includes PDF.js (Mozilla Foundation,
Apache-2.0), see [NOTICE](NOTICE). Not affiliated with or endorsed by Moomoo Financial Singapore or Futu Holdings.
