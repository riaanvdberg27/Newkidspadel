/**
 * Netcash Pay Now — server-side helper.
 *
 * Reference: official Netcash WooCommerce plugin (Netcash-ZA/PayNow-WooCommerce)
 * and the Netcash\PayNow PHP SDK (iedev1/paynow-php).
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
 * Default Netcash Software Vendor Key (SVK).
 * Netcash requires the `m2` field on every Pay Now request. Registered ISVs
 * have their own key; everyone else uses this documented default value.
 * Can be overridden with the NETCASH_SOFTWARE_VENDOR_KEY env var.
 */
export const NETCASH_DEFAULT_SOFTWARE_VENDOR_KEY = "24ade73c-98cf-47b3-99be-cc7b867b3080"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetcashPaymentType = "once-off" | "monthly"

export interface NetcashPayNowInput {
  /** Netcash Pay Now service key → sent as m1 */
  serviceKey: string
  /** Netcash Software Vendor Key → sent as m2 */
  softwareVendorKey: string
  /** Unique, single-use transaction reference → sent as p2 */
  orderReference: string
  /** Amount in Rands, e.g. "300.00" → sent as p4 */
  amount: string
  /** Description of the goods/service shown on the Netcash page → sent as p3 */
  itemDescription: string
  /** Customer email → sent as m9 */
  customerEmail: string
  /** Customer mobile number → sent as m11 */
  customerMobile?: string
  /** 'once-off' or 'monthly' subscription */
  paymentType: NetcashPaymentType
  /** For monthly: number of billing cycles → sent as m17 */
  subscriptionCycles?: number
  /**
   * Extra echo-back fields — Netcash returns these in Extra1/Extra2/Extra3
   * in the ITN POST so you can look up your own records.
   *   extra1 → m4 → Extra1
   *   extra2 → m5 → Extra2
   *   extra3 → m6 → Extra3
   */
  extra1?: string
  extra2?: string
  extra3?: string
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
 * Field map per the OFFICIAL Netcash Pay Now specification
 * (https://api.netcash.co.za/inbound-payments/pay-now/):
 *
 *   MANDATORY on every request:
 *     m1     = Service Key                       (authentication)
 *     m2     = Software Vendor Key               (default SVK for non-ISVs)
 *     p2     = Unique, single-use reference      ← returned as "Reference" in ITN
 *     p3     = Description of goods/service
 *     p4     = Amount (Rands, 2 decimals)
 *     Budget = "Y" or "N"                        (budget/instalment indicator)
 *
 *   OPTIONAL:
 *     m4     = Extra1  → echoed back as Extra1 in the ITN
 *     m5     = Extra2  → echoed back as Extra2
 *     m6     = Extra3  → echoed back as Extra3
 *     m9     = Customer email
 *     m11    = Customer mobile number
 *
 *   RECURRING / TOKENISATION (monthly subscriptions):
 *     m14    = "True"  (tokenise card)
 *     m15    = "Y"     (return the card token in the ITN postback)
 *     m17    = Number of subscription cycles
 *     m18    = Frequency (1 = Monthly)
 *
 * NOTE: The Accept / Decline / Notify / Redirect URLs are NOT posted here —
 * Netcash reads them from your NetConnector portal profile. The merchant must
 * configure the Notify URL to `<domain>/api/netcash/notify` in the portal.
 */
export function buildNetcashPayNowFields(input: NetcashPayNowInput): NetcashFormFields {
  const fields: NetcashFormFields = {
    // --- Mandatory ---
    m1: input.serviceKey,
    m2: input.softwareVendorKey,
    p2: input.orderReference,
    p3: input.itemDescription.slice(0, 200),
    p4: input.amount,
    Budget: "N",
  }

  // --- Optional customer + echo-back fields ---
  if (input.customerEmail) fields.m9 = input.customerEmail
  if (input.customerMobile) fields.m11 = input.customerMobile
  if (input.extra1) fields.m4 = input.extra1
  if (input.extra2) fields.m5 = input.extra2
  if (input.extra3) fields.m6 = input.extra3

  // --- Recurring subscription: tokenise + create a Netcash-managed schedule ---
  if (input.paymentType === "monthly") {
    fields.m14 = "True"                                  // Tokenise card
    fields.m15 = "Y"                                     // Return token in ITN
    fields.m17 = String(input.subscriptionCycles ?? 12) // Billing cycles
    fields.m18 = "1"                                     // 1 = Monthly
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
  /** Your order reference — the value you sent as p3 */
  Reference?: string
  /** Echo-back of your m2 field */
  Extra1?: string
  /** Echo-back of your m2 field */
  Extra2?: string
  /** Echo-back of your m3 field */
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
  const softwareVendorKey =
    process.env.NETCASH_SOFTWARE_VENDOR_KEY ?? NETCASH_DEFAULT_SOFTWARE_VENDOR_KEY

  const formFields = buildNetcashPayNowFields({
    serviceKey,
    softwareVendorKey,
    orderReference: input.referenceNumber,
    amount: input.packagePrice.toFixed(2),
    itemDescription:
      input.paymentType === "once-off"
        ? `Next Gen Padel — Once-off enrollment: ${input.packageName}`
        : `Next Gen Padel — Monthly subscription: ${input.packageName}`,
    customerEmail: input.parentEmail,
    customerMobile: input.parentMobile,
    paymentType: input.paymentType,
    // Echo enrollment ID back in Extra1 so the webhook can find the record.
    extra1: String(input.enrollmentId),
  })

  return { netcashUrl: NETCASH_PAY_NOW_URL, formFields }
}
