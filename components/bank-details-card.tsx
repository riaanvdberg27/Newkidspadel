// Next Gen Padel Academy EFT banking details — shown as a fallback whenever a
// Netcash card payment fails, is declined, or the gateway is unreachable.
export const NEXT_GEN_BANK_DETAILS = {
  accountName: "Next Gen Padel Academy",
  bankName: "FNB",
  accountNumber: "63214278441",
  branchCode: "252445",
}

export function BankDetailsCard({
  amount,
  paymentReference,
  note,
}: {
  /** Amount owed, in Rands. Omit the row entirely if unknown. */
  amount?: number
  /** The reference the parent must use so the payment can be matched to their enrollment. */
  paymentReference?: string
  /** Optional extra note shown above the details, e.g. explaining why EFT is being offered. */
  note?: string
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5 text-left shadow-sm">
      <p className="text-sm font-bold text-navy">Pay via EFT Instead</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {note ?? "You can also complete your payment manually via EFT using the banking details below."}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">Account Name</dt>
          <dd className="font-semibold text-navy">{NEXT_GEN_BANK_DETAILS.accountName}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">Bank</dt>
          <dd className="font-semibold text-navy">{NEXT_GEN_BANK_DETAILS.bankName}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">Account Number</dt>
          <dd className="font-semibold text-navy">{NEXT_GEN_BANK_DETAILS.accountNumber}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">Branch Code</dt>
          <dd className="font-semibold text-navy">{NEXT_GEN_BANK_DETAILS.branchCode}</dd>
        </div>
        {amount !== undefined && (
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-semibold text-navy">R{amount.toLocaleString()}</dd>
          </div>
        )}
        {paymentReference && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment Reference</dt>
            <dd className="font-black text-navy">{paymentReference}</dd>
          </div>
        )}
      </dl>
      {paymentReference && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">Important</p>
          <p className="mt-1 text-xs text-amber-700">
            Use <strong>{paymentReference}</strong> as the payment reference so we can match your
            payment and confirm your enrollment.
          </p>
        </div>
      )}
    </div>
  )
}
