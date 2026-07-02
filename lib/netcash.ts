/**
 * Netcash Pay Now — server-side helper.
 *
 * Docs: https://netcash.co.za/paynow
 *
 * Environment variables required:
 *   NETCASH_SERVICE_KEY   — Pay Now service key from Netcash portal
 *   NETCASH_MERCHANT_KEY  — Your merchant account key
 *   NEXT_PUBLIC_BASE_URL  — Public HTTPS URL of the deployment
 */

import crypto from "crypto"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NETCASH_PAY_NOW_URL = "https://paynow.netcash.co.za/site/paynow.aspx"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetcashPaymentType = "once-off" | "monthly"

export interface NetcashPayNowInput {
  /** Netcash Pay Now service key */
  serviceKey: string
  /** Your merchant key */
  merchantKey: string
  /** Unique order / reference in your system */
  orderReference: string
  /** Amount in Rands (e.g. 300.00) */
  amount: string
  /** Short item description shown on the Netcash page */
  itemName: string
  /** Optional extra description */
  itemDescription?: string
  /** URL Netcash posts the result notification to */
  notifyUrl: string
  /** URL the customer is sent to after successful payment */
  returnUrl: string
  /** URL the customer is sent to if they cancel */
  cancelUrl: string
  /** Customer email */
  customerEmail: string
  /** Customer first name */
  customerFirstName?: string
  /** Customer last name */
  customerLastName?: string
  /** 'once-off' or 'monthly' subscription */
  paymentType: NetcashPaymentType
  /** Extra key=value pairs to echo back in the notification */
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
 * Returns a plain object of key → value pairs that should be POSTed to
 * NETCASH_PAY_NOW_URL.
 */
export function buildNetcashPayNowFields(input: NetcashPayNowInput): NetcashFormFields {
  const fields: NetcashFormFields = {
    // Required Netcash fields
    p1: input.serviceKey,                      // Service key
    p2: input.merchantKey,                     // Merchant key
    p3: input.orderReference,                  // Order reference
    p4: input.amount,                          // Amount (Rands)
    p5: input.itemName.slice(0, 100),          // Item name
    p6: (input.itemDescription ?? "").slice(0, 200), // Item description
    p10: input.returnUrl,                      // Return URL
    p11: input.cancelUrl,                      // Cancel URL
    m1: input.notifyUrl,                       // Notification URL
    m4: input.customerEmail,                   // Customer email
  }

  if (input.customerFirstName) fields.m5 = input.customerFirstName
  if (input.customerLastName) fields.m6 = input.customerLastName

  // Recurring / subscription — tell Netcash to create a recurring token
  if (input.paymentType === "monthly") {
    fields.p12 = "1" // Enable recurring
    fields.p14 = "2" // Frequency: 2 = monthly
  }

  // Echo-back fields
  if (input.extra1) fields.m2 = input.extra1
  if (input.extra2) fields.m3 = input.extra2
  if (input.extra3) fields.m7 = input.extra3

  return fields
}

// ---------------------------------------------------------------------------
// Webhook / ITN (Instant Transaction Notification) verification
// ---------------------------------------------------------------------------

export interface NetcashItnPayload {
  /** Netcash transaction reference */
  TransactionId?: string
  /** Your order reference (p3 from the form) */
  OrderId?: string
  /** "Approved" | "Declined" | "Cancelled" | etc. */
  TransactionStatus?: string
  /** Payment amount in Rands */
  Amount?: string
  /** Recurring subscription token (only set for monthly) */
  SubscriptionToken?: string
  /** Netcash-supplied hash for verification */
  Hash?: string
  /** Any extra fields echoed back */
  [key: string]: string | undefined
}

/**
 * Verify the hash that Netcash sends with every ITN notification.
 * Netcash builds the hash as MD5( serviceKey + orderRef + amount + transactionId + status ).
 */
export function verifyNetcashItn(
  payload: NetcashItnPayload,
  serviceKey: string,
): boolean {
  const { TransactionId = "", OrderId = "", Amount = "", TransactionStatus = "", Hash } = payload

  if (!Hash) return false

  const hashInput = [serviceKey, OrderId, Amount, TransactionId, TransactionStatus].join("")
  const expected = crypto.createHash("md5").update(hashInput).digest("hex").toUpperCase()

  return expected === Hash?.toUpperCase()
}

// ---------------------------------------------------------------------------
// Build the Netcash payment request from enrollment data
// ---------------------------------------------------------------------------

export interface BuildNetcashPaymentInput {
  referenceNumber: string
  enrollmentId: number
  parentName: string
  parentEmail: string
  packageName: string
  packagePrice: number   // in Rands
  paymentType: NetcashPaymentType
}

export async function buildNetcashPayment(input: BuildNetcashPaymentInput): Promise<{
  netcashUrl: string
  formFields: NetcashFormFields
}> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ??
    "https://localhost:3000"

  const serviceKey = process.env.NETCASH_SERVICE_KEY ?? ""
  const merchantKey = process.env.NETCASH_MERCHANT_KEY ?? ""

  const nameParts = input.parentName.trim().split(" ")
  const firstName = nameParts[0] ?? input.parentName
  const lastName = nameParts.slice(1).join(" ") || undefined

  const formFields = buildNetcashPayNowFields({
    serviceKey,
    merchantKey,
    orderReference: input.referenceNumber,
    amount: input.packagePrice.toFixed(2),
    itemName: `Next Gen Padel — ${input.packageName}`,
    itemDescription:
      input.paymentType === "once-off"
        ? `Once-off enrollment fee for ${input.packageName}`
        : `Monthly subscription for ${input.packageName}`,
    notifyUrl: `${baseUrl}/api/netcash/notify`,
    returnUrl: `${baseUrl}/enrollment/success?ref=${encodeURIComponent(input.referenceNumber)}&name=${encodeURIComponent(input.parentName)}`,
    cancelUrl: `${baseUrl}/enrollment?cancelled=1`,
    customerEmail: input.parentEmail,
    customerFirstName: firstName,
    customerLastName: lastName,
    paymentType: input.paymentType,
    // Echo the enrollment ID so we can look it up in the webhook
    extra1: String(input.enrollmentId),
  })

  return { netcashUrl: NETCASH_PAY_NOW_URL, formFields }
}
