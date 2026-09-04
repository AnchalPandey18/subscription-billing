/**
 * Utility formatters for handling dates, currency, and MongoDB Decimal128 values.
 * Prevents `[object Object]` outputs when amounts come as { "$numberDecimal": "1499.99" }.
 */

/**
 * Parses any amount representation (Decimal128 object, number, string) into a float number.
 * @param {any} amount
 * @returns {number}
 */
export const parseAmount = (amount) => {
    if (amount === null || amount === undefined) {
        return 0;
    }

    // Handle MongoDB Decimal128 object: { $numberDecimal: "1499.99" }
    if (typeof amount === "object" && amount.$numberDecimal !== undefined) {
        const parsed = parseFloat(amount.$numberDecimal);
        return isNaN(parsed) ? 0 : parsed;
    }

    if (typeof amount === "number") {
        return isNaN(amount) ? 0 : amount;
    }

    if (typeof amount === "string") {
        const parsed = parseFloat(amount.trim());
        return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
};

/**
 * Returns clean 2-decimal string representation (e.g. "1499.99").
 * @param {any} amount
 * @returns {string}
 */
export const formatAmount = (amount) => {
    const parsed = parseAmount(amount);
    return parsed.toFixed(2);
};

/**
 * Formats amount into localized currency string (e.g. "₹1,499.99" or "INR 1,499.99").
 * @param {any} amount
 * @param {string} currency
 * @returns {string}
 */
export const formatCurrency = (amount, currency = "INR") => {
    const parsed = parseAmount(amount);
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(parsed);
    } catch {
        return `${currency || "INR"} ${parsed.toFixed(2)}`;
    }
};

/**
 * Formats ISO date string into readable display format (e.g. "04 Sep 2026").
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

/**
 * Formats date and time (e.g. "04 Sep 2026, 05:30 PM").
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

/**
 * Formats date for HTML <input type="date"> (YYYY-MM-DD).
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
};

/**
 * Calculates how many days an invoice is overdue.
 * @param {string|Date} dueDate
 * @returns {number} positive number if overdue, 0 or negative if not overdue
 */
export const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
