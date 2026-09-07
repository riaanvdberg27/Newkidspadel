/**
 * Netcash Pay Now — server-side helper.
 *
 * Reference: official Netcash Developer Documentation
 *   https://api.netcash.co.za/inbound-payments/pay-now/pay-now-ecommerce/
 *
 * IMPORTANT — Netcash Pay Now does NOT accept per-transaction Accept/Decline/
 * Notify/Redirect URLs as POST fields. Those URLs are configured ONCE in the
 * Netcash account under Account Profile → NetConnector → Pay Now, and must be
 * set there to:
 *   Notify URL   → {baseUrl}/api/netcash/notify
 *   Accept URL   → {baseUrl}/enrollment/success
 *   Decline URL  → {baseUrl}/enrollment?cancelled=1
 *   Redirect URL → {baseUrl}/enrollment?cancelled=1
 * Per-transaction querystring data (e.g. ?ref=...&name=...) is appended to
 * the Accept/Decline URL automatically by Netcash from the m10 field.
 *
 * Environment variables required:
 *   NETCASH_SERVICE_KEY   — Pay Now service key from Netcash portal (NetConnector → Pay Now)
 *   NEXT_PUBLIC_BASE_URL  — Public HTTPS URL of the deployment
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NETCASH_PAY_NOW_URL = "https://paynow.netcash.co.za/site/paynow.aspx"

/**
 * Software Vendor Key (m2) — identifies the origin of the integration to
 * Netcash. This is the default value Netcash publishes for non-ISV/custom
 * integrations (i.e. anyone who isn't a registered Netcash software vendor).
 */
export const NETCASH_SOFTWARE_VENDOR_KEY = "24ade73c-98cf-47b3-99be-cc7b867b3080"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetcashPaymentType = "once-off" | "monthly"

export interface NetcashPayNowInput {
  /** Netcash Pay Now service key (m1) */
  serviceKey: string
  /** Unique order / reference in your system — used only ONCE (p2) */
  orderReference: string
  /** Amount in Rands, e.g. "300.00" (p4) */
  amount: string
  /** Description of goods, max 50 chars (p3) */
  itemDescription: string
  /** Customer email — receives an email receipt (m9) */
  customerEmail?: string
  /** Customer mobile number, e.g. "0821234567" (m11) */
  customerMobile?: string
  /** 'once-off' or 'monthly' subscription */
  paymentType: NetcashPaymentType
  /**
   * Extra echo-back fields — Netcash returns these in Extra1/Extra2/Extra3
   * in the ITN POST so you can look up your own records without a DB query.
   */
  extra1?: string // sent as m4, returned as Extra1
  extra2?: string // sent as m5, returned as Extra2
  extra3?: string // sent as m6, returned as Extra3
  /**
   * Querystring appended by Netcash to the Accept/Decline URL configured
   * in the Netcash NetConnector Pay Now profile (m10), e.g.
   * "ref=NGP-2026-ABC&name=John%20Doe"
   */
  returnQueryParams?: string
}

export interface NetcashFormFields {
  [key: string]: string
}

// ---------------------------------------------------------------------------
// Build Pay Now form fields
// ---------------------------------------------------------------------------

/**
 * Build the hidden form fields for a Netcash Pay Now redirect.
 *
 * Field map per official Netcash documentation
 * (https://api.netcash.co.za/inbound-payments/pay-now/pay-now-ecommerce/):
 *
 *   Mandatory:
 *   m1     = Pay Now Service Key
 *   m2     = Software Vendor Key (fixed default value for non-ISVs)
 *   p2     = Unique order reference — must be used ONCE (max 25 chars)
 *   p3     = Description of goods (max 50 chars)
 *   p4     = Amount in Rands, 2 decimals
 *   Budget = "Y" (always required, even for non-budget transactions)
 *
 *   Optional:
 *   m4  = Extra1 (returned as Extra1 in the ITN/Accept/Decline POST)
 *   m5  = Extra2 (returned as Extra2)
 *   m6  = Extra3 (returned as Extra3)
 *   m9  = Cardholder email (sends an email receipt)
 *   m11 = Cardholder mobile number
 *   m10 = Querystring appended to the configured Accept/Decline URL
 *
 *   Subscription billing (paymentType === "monthly"):
 *   m14 = "1" — tokenize card (mandatory for subscriptions)
 *   m16 = "1" — subscription indicator
 *   m17 = number of cycles (max 3 digits — "999" ≈ open-ended)
 *   m18 = frequency, "1" = monthly
 *   m19 = subscription start date, CCYY-MM-DD
 *   m20 = recurring amount in Rands, 2 decimals
 *
 * NOTE: The Accept/Decline/Notify/Redirect URLs are NOT posted as form
 * fields — they must be configured once in the Netcash account under
 * Account Profile → NetConnector → Pay Now.
 */
export function buildNetcashPayNowFields(input: NetcashPayNowInput): NetcashFormFields {
  const fields: NetcashFormFields = {
    m1: input.serviceKey,
    m2: NETCASH_SOFTWARE_VENDOR_KEY,
    p2: input.orderReference.slice(0, 25),
    p3: input.itemDescription.slice(0, 50),
    p4: input.amount,
    Budget: "Y",
  }

  if (input.customerEmail) fields.m9 = input.customerEmail
  if (input.customerMobile) fields.m11 = input.customerMobile
  if (input.returnQueryParams) fields.m10 = input.returnQueryParams

  // Echo-back fields — returned as Extra1/Extra2/Extra3 in the ITN POST
  if (input.extra1) fields.m4 = input.extra1
  if (input.extra2) fields.m5 = input.extra2
  if (input.extra3) fields.m6 = input.extra3

  // Recurring subscription — instruct Netcash to tokenise the card and
  // create a monthly subscription starting today, running indefinitely.
  if (input.paymentType === "monthly") {
    const today = new Date().toISOString().slice(0, 10) // CCYY-MM-DD
    fields.m14 = "1"   // Tokenize card (mandatory for subscriptions)
    fields.m16 = "1"   // Subscription indicator: Yes
    fields.m17 = "999" // Number of cycles — effectively open-ended
    fields.m18 = "1"   // Frequency: 1 = Monthly
    fields.m19 = today // Subscription start date
    fields.m20 = input.amount // Recurring amount
  }

  return fields
}

// ---------------------------------------------------------------------------
// ITN (Instant Transaction Notification) payload type
// ---------------------------------------------------------------------------

/**
 * Exact fields Netcash POSTs to your Notify URL.
 *
 * Source: Netcash-ZA/PayNow-WooCommerce → includes/class-wc-gateway-paynow.php
 * `getPostData()` method (the canonical list of expected keys).
 *
 * NOTE: Netcash does NOT send a cryptographic hash/signature in the ITN POST.
 * Verification is done by:
 *   1. Checking TransactionAccepted === "TRUE"
 *   2. Looking up the Reference in your own DB to confirm it is a real order
 *   3. Comparing the posted Amount against the expected amount stored in your DB
 */
export interface NetcashItnPayload {
  /** "TRUE" or "FALSE" */
  TransactionAccepted?: string
  /** Decline / cancel reason text */
  Reason?: string
  /** Cardholder IP address */
  CardHolderIpAddr?: string
  /** Netcash internal transaction trace reference */
  RequestTrace?: string
  /** Your order reference — the value you sent as p2 */
  Reference?: string
  /** Echo-back of your m4 field */
  Extra1?: string
  /** Echo-back of your m5 field */
  Extra2?: string
  /** Echo-back of your m6 field */
  Extra3?: string
  /** Transaction amount in Rands */
  Amount?: string
  /** Payment method used (e.g. "CC", "EFT") */
  Method?: string
  /** Notification type — "DEPOSITRECEIPT" for notify URL calls */
  type?: string
  /** "TRUE" or "FALSE" for subscription setup */
  SubscriptionAccepted?: string
  /** Reason for subscription failure */
  SubscriptionReason?: string
  /** Card token for recurring payments */
  ccToken?: string
  /** Cardholder name on card */
  ccHolder?: string
  /** Masked card number, e.g. "4111 **** **** 1111" */
  ccMasked?: string
  /** Card expiry date */
  ccExpiry?: string
  /** Allow any unknown fields */
  [key: string]: string | undefined
}

// ---------------------------------------------------------------------------
// ITN verification
// ---------------------------------------------------------------------------

export interface NetcashItnVerificationResult {
  valid: boolean
  accepted: boolean
  declined: boolean
  cancelled: boolean
  pending: boolean
  subscriptionAccepted: boolean
  reason: string
  reference: string
  amount: number          // in Rands
  requestTrace: string
  ccToken: string | null
  extra1: string | null
  extra2: string | null
  extra3: string | null
}

/**
 * Parse and verify a Netcash ITN notification.
 *
 * Netcash does NOT sign ITN payloads with a hash/HMAC. The official
 * verification strategy (per the Netcash PHP SDK and the WooCommerce plugin)
 * is:
 *
 *   Step 1 — Reference check: confirm the `Reference` field matches a known
 *             order in your database.  (Done by the caller.)
 *
 *   Step 2 — Amount check: compare the posted `Amount` against the amount
 *             stored in your order record.  The official SDK uses
 *             `checkEqualAmounts()` which compares float-formatted strings.
 *             (Exposed as `amountMatchesExpected()` below.)
 *
 *   Step 3 — TransactionAccepted: only update order status when this is "TRUE".
 *
 * This function handles Step 1-compatible parsing and Step 3.
 * The caller must perform Step 2 using `amountMatchesExpected()`.
 */
export function parseNetcashItn(payload: NetcashItnPayload): NetcashItnVerificationResult {
  const accepted    = payload.TransactionAccepted?.toUpperCase() === "TRUE"
  const declined    = !accepted && (payload.Reason ?? "") !== ""
  const cancelled   = !accepted && !declined
  const pending     = payload.type === "PENDING"
  const subAccepted = payload.SubscriptionAccepted?.toUpperCase() === "TRUE"

  return {
    valid: true, // structural validity — caller must check reference + amount
    accepted,
    declined,
    cancelled,
    pending,
    subscriptionAccepted: subAccepted,
    reason: payload.Reason ?? "",
    reference: payload.Reference ?? "",
    amount: parseFloat(payload.Amount ?? "0"),
    requestTrace: payload.RequestTrace ?? "",
    ccToken: payload.ccToken ?? null,
    extra1: payload.Extra1 ?? null,
    extra2: payload.Extra2 ?? null,
    extra3: payload.Extra3 ?? null,
  }
}

/**
 * Amount comparison helper — mirrors the official SDK's `checkEqualAmounts()`.
 * Compares both values as floats rounded to 2 decimal places.
 */
export function amountMatchesExpected(
  postedAmountRands: number,
  expectedAmountCents: number,
): boolean {
  const posted   = Math.round(postedAmountRands * 100)
  const expected = Math.round(expectedAmountCents)
  return posted === expected
}

// ---------------------------------------------------------------------------
// Build the Netcash payment request from enrollment data
// ---------------------------------------------------------------------------

export interface BuildNetcashPaymentInput {
  referenceNumber: string
  enrollmentId: number
  parentName: string
  parentEmail: string
  parentMobile?: string
  packageName: string
  packagePrice: number   // in Rands
  paymentType: NetcashPaymentType
}

export async function buildNetcashPayment(input: BuildNetcashPaymentInput): Promise<{
  netcashUrl: string
  formFields: NetcashFormFields
}> {
  const serviceKey = process.env.NETCASH_SERVICE_KEY ?? ""

  // p3 — description of goods, max 50 chars. Netcash rejects special
  // characters like | — / \ ; keep to alphanumeric, spaces, and hyphens.
  const itemDescription = `${input.referenceNumber} ${input.packageName}`.slice(0, 50)

  // m10 — appended by Netcash as a querystring to the configured Accept/
  // Decline URL, so the success page can read ?ref=...&name=...
  const returnQueryParams = `ref=${encodeURIComponent(input.referenceNumber)}&name=${encodeURIComponent(input.parentName)}`

  const formFields = buildNetcashPayNowFields({
    serviceKey,
    orderReference: input.referenceNumber,
    amount: input.packagePrice.toFixed(2),
    itemDescription,
    customerEmail: input.parentEmail,
    customerMobile: input.parentMobile,
    paymentType: input.paymentType,
    returnQueryParams,
    // Echo enrollment ID back in Extra1 so the webhook can find the record
    // without a full-table scan on the referenceNumber index.
    extra1: String(input.enrollmentId),
  })

  return { netcashUrl: NETCASH_PAY_NOW_URL, formFields }
}
