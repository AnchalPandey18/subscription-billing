import CreditNote from "../models/CreditNote.js";
import Invoice from "../models/Invoice.js";


// Convert money string to cents safely
const toCents = (value) => {
    const parts = value.toString().split(".");

    const rupees = BigInt(parts[0]);
    const paise = BigInt((parts[1] || "").padEnd(2, "0"));

    return rupees * 100n + paise;
};


// Create Credit Note
export const createCreditNote = async (req, res) => {
    try {
        const {
            invoiceId,
            creditNoteNumber,
            amount,
            reason
        } = req.body;


        // Validate required fields
        if (!invoiceId || !creditNoteNumber || !amount || !reason) {
            return res.status(400).json({
                message:
                    "Invoice ID, credit note number, amount and reason are required"
            });
        }


        // Validate amount format
        const amountString = amount.toString().trim();

        if (!/^\d+(\.\d{1,2})?$/.test(amountString)) {
            return res.status(400).json({
                message: "Credit note amount must be a valid amount"
            });
        }


        const creditAmount = Number(amountString);

        if (creditAmount <= 0) {
            return res.status(400).json({
                message: "Credit note amount must be greater than 0"
            });
        }


        // Find invoice
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }


        // Credit notes are allowed only for Paid invoices
        if (invoice.status !== "Paid") {
            return res.status(400).json({
                message: "Credit note can only be created for a Paid invoice"
            });
        }


        // Get all existing credit notes for this invoice
        const existingCreditNotes = await CreditNote.find({
            invoiceId: invoice._id
        });


        // Calculate already credited amount in cents
        let totalCreditedCents = 0n;

        for (const creditNote of existingCreditNotes) {
            totalCreditedCents += toCents(
                creditNote.amount.toString()
            );
        }


        // Calculate invoice amount in cents
        const invoiceAmountCents = toCents(
            invoice.amount.toString()
        );


        // Calculate new credit amount in cents
        const newCreditAmountCents = toCents(amountString);


        // Check cumulative credit amount
        if (
            totalCreditedCents + newCreditAmountCents >
            invoiceAmountCents
        ) {
            const remainingCents =
                invoiceAmountCents - totalCreditedCents;

            return res.status(400).json({
                message:
                    "Credit note amount exceeds the remaining invoice balance",
                remainingAmount:
                    `${remainingCents / 100n}.${(remainingCents % 100n)
                        .toString()
                        .padStart(2, "0")}`
            });
        }


        // Create credit note
        const creditNote = await CreditNote.create({
            creditNoteNumber,
            invoiceId: invoice._id,
            amount: amountString,
            reason,
            createdBy: req.user.userId
        });


        res.status(201).json({
            message: "Credit note created successfully",
            creditNote
        });


    } catch (error) {

        // Duplicate credit note number
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Credit note number already exists"
            });
        }


        res.status(500).json({
            message: "Failed to create credit note",
            error: error.message
        });
    }
};