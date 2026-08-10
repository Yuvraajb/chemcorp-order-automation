# n8n Order Automation — Setup Checklist & Workflow Reference

This covers two things: (1) everything you need to edit before running these workflows, and (2) a full explanation of what each step does, with the exact input and output shape at every node.

---

# PART 1 — Pre-Execution Checklist

Go through these in order. Nothing will run correctly until all three are done.

## 1. Credentials (all 3 workflows)

| Credential | Used in | Where to set it |
|---|---|---|
| IMAP (order inbox) | Order Processing → "Email Trigger (IMAP)" | Click the node → Credentials → Create New |
| Google Sheets OAuth2 | Order Processing → "Log To Google Sheets"; BOM Explode → "Lookup BOM Rows"; Daily Report → "Read Order Log" | Same credential can be reused across all three nodes once created |
| SMTP (sending email) | Daily Report → "Send Report Email" | Click the node → Credentials → Create New |

You only need to create each credential once — n8n lets you attach the same saved credential to multiple nodes.

## 2. Google Sheet setup

Create one spreadsheet with two tabs, matching these exact headers (case and spacing matter — the code nodes reference these column names directly):

**Tab `BOM`**
`Product Name | Raw Material Name | Qty Per Unit | Is Self-Produced`

**Tab `Order Log`**
`Timestamp | Order Number | Product | Qty Ordered | Stock Used | Raw Materials To Buy (JSON) | Items To Manufacture (JSON)`

Fill in the `BOM` tab with your real product/raw-material data. Leave `Order Log` empty — the workflow writes to it.

Then in **every** Google Sheets node (3 total), replace `REPLACE_WITH_YOUR_SHEET_ID` with your actual spreadsheet ID (the long string in the sheet's URL between `/d/` and `/edit`).

## 3. Tally connection

Confirm HTTP/ODBC server is enabled in Tally (F1 → Settings → Advanced Configuration) and note the IP address of that machine and the port you set.

Replace `http://REPLACE_TALLY_IP:9000` in these 3 HTTP Request nodes:
- Order Processing → "Query Tally Stock"
- Order Processing → "Deduct Stock In Tally"
- BOM Explode → "Query Tally Stock"

Also replace `REPLACE_WITH_YOUR_COMPANY_NAME` in the two "Build Tally Stock Query XML" Set nodes (Order Processing and BOM Explode).

**Important — do this before trusting any output:** send one test query manually (e.g. via Postman or curl) to your Tally instance first, and look at the real XML it returns. The `CLOSINGBALANCE` path used in "Compute Shortfall" in both workflows is a reasonable starting guess, not a confirmed value for your setup. If Tally's response nests fields differently, you'll need to adjust the path in that Code node.

## 4. Subworkflow linking (BOM Explode → itself, and Order Processing → BOM Explode)

1. Open **BOM Explode**, save it once, and copy its workflow ID from the browser URL.
2. Paste that ID into:
   - BOM Explode's own **"Call Self Recursively"** node (`workflowId` field)
   - Order Processing's **"Call BOM Explode"** node (`workflowId` field)

## 5. Email format

Open **Order Processing → "Extract Order Table"**. This node currently expects an HTML table with 2 columns per row (product, qty), extracted with a simple regex. Send yourself one real order email, look at its actual HTML source, and adjust the regex (or replace it with a proper HTML parser) so it matches your real table structure. This is the single most likely thing to silently fail if left as-is.

## 6. Subject line filter

Open **Order Processing → "Filter By Subject Pattern"** and replace `REPLACE_WITH_YOUR_SUBJECT_REGEX` with your real order-number pattern (e.g. `^ORD-[0-9]+$`).

## 7. Daily report recipients

Open **Daily Report → "Send Report Email"** and replace `REPLACE_WITH_SENDER_EMAIL` and `REPLACE_WITH_RECIPIENT_EMAILS` with real addresses.

## 8. Timezone check

Open **Daily Report → "Schedule Trigger 3PM"**. Confirm your n8n instance's timezone (Settings → in the n8n admin panel, not this node) matches your actual local time, or 3pm will fire at the wrong hour.

## 9. Test before activating

Run each workflow manually once (n8n's "Execute Workflow" button) with a real test email/order before switching any of them to Active. This is the only way to catch Tally XML shape mismatches early.

---

# PART 2 — Workflow Reference

## Workflow 1: Order Processing

**Trigger:** a new email arrives in the watched inbox.
**Ends with:** stock deducted in Tally for what was fulfilled, and one row per product logged to the `Order Log` sheet.

| Step | Node | Input | What it does | Output |
|---|---|---|---|---|
| 1 | Email Trigger (IMAP) | New email in inbox | Picks up the raw email | `{ subject, textHtml, text, from, ... }` |
| 2 | Filter By Subject Pattern | Email object | Checks subject against your order-number regex; anything not matching stops here | Same object, only if matched |
| 3 | Extract Order Table | Email object | Parses the HTML table in the body | `{ orderNumber, items: [{ product, qtyOrdered }, ...] }` |
| 4 | Split Order Items | One item with an `items` array | Turns the array into one workflow item per product | One item per product: `{ product, qtyOrdered }` |
| 5 | Build Tally Stock Query XML | `{ product, qtyOrdered }` | Builds the XML string to query Tally for this product's stock | Adds `tallyXmlQuery` (string) |
| 6 | Query Tally Stock | `tallyXmlQuery` | POSTs it to Tally | Raw XML text response from Tally |
| 7 | Parse Tally XML | XML text | Converts to JSON | Nested JSON object mirroring Tally's XML structure |
| 8 | Compute Shortfall | Parsed Tally JSON | Pulls out the stock number, compares to qty ordered | `{ orderNumber, product, qtyOrdered, stockQty, shortfall, fulfilledFromStock }` |
| 9 | IF Enough Stock | Shortfall object | Branches: `shortfall <= 0` → true path; otherwise → false path | Same object, routed |
| 10a | Mark Fulfilled From Stock (true branch) | Shortfall object | Sets empty purchase/manufacture lists since nothing further is needed | Adds `rawMaterialsToPurchase: []`, `itemsToManufacture: []` |
| 10b | Call BOM Explode (false branch) | Shortfall object | Calls Workflow 2 with `{ itemName: product, qtyNeeded: shortfall, orderNumber }` | Returns `{ rawMaterialsToPurchase: [...], itemsToManufacture: [...] }` from Workflow 2 |
| 11 | Merge Results | Both branches | Recombines into a single stream | One object per product, now including purchase/manufacture lists |
| 12 | Build Stock Deduction XML | Merged object | Builds a Tally "Stock Journal" XML voucher for the fulfilled quantity | Adds `tallyDeductionXml` (string) |
| 13 | Deduct Stock In Tally | `tallyDeductionXml` | POSTs the voucher to Tally, reducing recorded stock | Tally's import confirmation response |
| 14 | Log To Google Sheets | Full order-line object | Appends one row to `Order Log` | Row written; no further output used |

**Runs once per product in the order** — if an order has 3 products, steps 5–14 execute 3 times (once per loop iteration from the Split node).

---

## Workflow 2: BOM Explode (subworkflow, recursive)

**Trigger:** called by Workflow 1, or by itself.
**Input required:** `{ itemName: string, qtyNeeded: number, orderNumber: string }`
**Output produced:** `{ rawMaterialsToPurchase: [{ name, qty }, ...], itemsToManufacture: [...] }`

| Step | Node | Input | What it does | Output |
|---|---|---|---|---|
| 1 | When Called by Order Processing | `{ itemName, qtyNeeded, orderNumber }` | Entry point for this workflow | Same object |
| 2 | Build Tally Stock Query XML | Same | Builds XML to check stock of `itemName` | Adds `tallyXmlQuery` |
| 3 | Query Tally Stock | `tallyXmlQuery` | POSTs to Tally | Raw XML |
| 4 | Parse Tally XML | XML | Converts to JSON | Nested JSON |
| 5 | Compute Shortfall | Parsed JSON + original trigger data | Compares `qtyNeeded` to current stock | `{ itemName, orderNumber, qtyNeeded, stockQty, shortfall }` |
| 6 | IF Shortfall Exists | Shortfall object | `shortfall > 0` → true (needs BOM lookup); else → false (done) | Routed |
| 7a | Nothing Needed (false branch) | Shortfall object | Enough stock exists, nothing to buy/build | `{ rawMaterialsToPurchase: [], itemsToManufacture: [] }` |
| 7b | Lookup BOM Rows (true branch) | Shortfall object | Reads the `BOM` sheet, filtered to rows where `Product Name = itemName` | One item per raw material row: `{ Product Name, Raw Material Name, Qty Per Unit, Is Self-Produced }` |
| 8 | Calculate Raw Material Needs | BOM rows + shortfall | Multiplies each row's `Qty Per Unit` × shortfall | One item per raw material: `{ orderNumber, rawMaterialName, qtyNeeded, isSelfProduced }` |
| 9 | IF Is Self Produced | Each raw material item | Branches per item: self-produced → recurse; else → straight to purchase list | Routed, per item |
| 10a | Call Self Recursively (true branch) | `{ rawMaterialName, qtyNeeded, orderNumber }` | Calls this same workflow again, now treating the raw material as the new "item" | Returns `{ rawMaterialsToPurchase, itemsToManufacture }` from the recursive call, plus this raw material's name gets added to `itemsToManufacture` conceptually (see note below) |
| 10b | Add To Purchase List (false branch) | Same | This is a true leaf raw material — nothing more to explode | `{ rawMaterialsToPurchase: [{ name, qty }], itemsToManufacture: [] }` |
| 11 | Merge Recursion Branches | Both branches | Recombines | One item per raw material processed |
| 12 | Aggregate All Results | All items from the loop | Combines every raw material's results (across possibly many BOM rows and many recursive calls) into one final list | `{ rawMaterialsToPurchase: [...], itemsToManufacture: [...] }` — this is what gets returned to whoever called this workflow |

**Note on `itemsToManufacture`:** the current node set adds a self-produced raw material to the recursion but doesn't explicitly append its name to `itemsToManufacture` before recursing — you'll want to add that line in "Call Self Recursively" or right before it, e.g. tag the raw material name into `itemsToManufacture` alongside triggering the recursive call, so the final report shows "make 40 units of Raw Material Y" rather than only the leaf-level purchases. This is a one-line addition once you're in the editor and can see real data flowing through.

**Termination:** this workflow keeps calling itself until it reaches a raw material where `Is Self-Produced = FALSE` in the BOM sheet — those become the leaf nodes that stop the recursion.

---

## Workflow 3: Daily Order Report

**Trigger:** Schedule Trigger, fires daily at 15:00 (server/instance timezone).
**Ends with:** one email sent, with an HTML summary in the body and an Excel attachment.

| Step | Node | Input | What it does | Output |
|---|---|---|---|---|
| 1 | Schedule Trigger 3PM | (time-based, no data input) | Fires once daily at 3pm | Empty trigger item |
| 2 | Read Order Log | — | Reads every row from the `Order Log` sheet | One item per row ever logged |
| 3 | Filter To Today | All rows | Keeps only rows whose `Timestamp` matches today's date; parses the two JSON columns back into arrays | Filtered rows, `rawMaterialsToPurchase`/`itemsToManufacture` now real arrays |
| 4 | Aggregate Report Data | Today's rows | Counts distinct order numbers, flattens all raw-material and manufacture lists, sums stock used | Single object: `{ reportDate, orderCount, orders, rawMaterialsToPurchase, itemsToManufacture, totalStockUsed }` |
| 5 | Build Report Table Rows | Aggregated object | Flattens `orders` into one row per product-line for the spreadsheet | One item per order line, spreadsheet-ready |
| 6 | Convert To Excel | Table rows | Builds the `.xlsx` binary file | Binary file under property `data` |
| 7 | Build Email Summary | Aggregated object (via separate branch) | Builds the HTML summary text | `{ emailHtml }` |
| 8 | Merge Excel And Summary | Excel binary + HTML text | Combines both into one item so the email node has everything | `{ data: <binary>, emailHtml: <string> }` |
| 9 | Send Report Email | Merged item | Sends the email with HTML body and Excel attachment | Email sent |

---

# Quick summary of what still needs real data before this works end to end

1. Real order email → confirm HTML structure → fix "Extract Order Table" regex
2. Real Tally stock query response → confirm field paths → fix "Compute Shortfall" in both workflows 1 and 2
3. Your actual BOM data → fill in the `BOM` sheet
4. Real credentials → IMAP, Google Sheets, SMTP
5. Workflow 2's own ID → paste into its self-call and into Workflow 1's call node
6. One full manual test run per workflow before activating any of them
