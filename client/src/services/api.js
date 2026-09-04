const API_URL = "http://localhost:5000/api";

const getToken = () => {
    return localStorage.getItem("token");
};

const getAuthHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response, defaultErrorMessage) => {
    let data;
    try {
        data = await response.json();
    } catch {
        data = { message: defaultErrorMessage || "An unexpected error occurred" };
    }

    if (!response.ok) {
        throw new Error(data.message || defaultErrorMessage || "Request failed");
    }

    return data;
};

// ==================== AUTH APIs ====================

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    return handleResponse(response, "Login failed");
};

export const registerUser = async (formData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });
    return handleResponse(response, "Registration failed");
};

export const getMe = async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to authenticate user");
};

// ==================== SUBSCRIPTION APIs ====================

export const getSubscriptions = async () => {
    const response = await fetch(`${API_URL}/subscriptions`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch subscriptions");
};

export const getSubscriptionById = async (id) => {
    const response = await fetch(`${API_URL}/subscriptions/${id}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch subscription");
};

export const createSubscription = async (subscriptionData) => {
    const response = await fetch(`${API_URL}/subscriptions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(subscriptionData)
    });
    return handleResponse(response, "Failed to create subscription");
};

export const updateSubscription = async (id, subscriptionData) => {
    const response = await fetch(`${API_URL}/subscriptions/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(subscriptionData)
    });
    return handleResponse(response, "Failed to update subscription");
};

export const archiveSubscription = async (id) => {
    const response = await fetch(`${API_URL}/subscriptions/${id}/archive`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to archive subscription");
};

// ==================== INVOICE APIs ====================

export const getInvoices = async (params = "") => {
    let queryStr = "";
    if (params) {
        queryStr = params.startsWith("?") ? params : `?${params}`;
    }
    const response = await fetch(`${API_URL}/invoices${queryStr}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch invoices");
};

export const getOverdueInvoices = async () => {
    const response = await fetch(`${API_URL}/invoices/overdue`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch overdue invoices");
};

export const createInvoice = async (invoiceData) => {
    const response = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(invoiceData)
    });
    return handleResponse(response, "Failed to create invoice");
};

export const issueInvoice = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}/issue`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to issue invoice");
};

export const payInvoice = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}/pay`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to mark invoice as paid");
};

export const voidInvoice = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}/void`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to void invoice");
};

export const bulkGenerateInvoices = async () => {
    const response = await fetch(`${API_URL}/invoices/bulk-generate`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to generate invoices");
};

export const exportInvoicesCSV = async (params = "") => {
    let queryStr = "";
    if (params) {
        queryStr = params.startsWith("?") ? params : `?${params}`;
    }
    const response = await fetch(`${API_URL}/invoices/export${queryStr}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        let errorMsg = "Failed to export invoices";
        try {
            const data = await response.json();
            errorMsg = data.message || errorMsg;
        } catch {
            // ignore
        }
        throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// ==================== CREDIT NOTE APIs ====================

export const createCreditNote = async (creditNoteData) => {
    const response = await fetch(`${API_URL}/credit-notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(creditNoteData)
    });
    return handleResponse(response, "Failed to create credit note");
};

// ==================== COLLABORATOR APIs ====================

export const getCollaborators = async (subscriptionId) => {
    const response = await fetch(`${API_URL}/collaborators/${subscriptionId}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch collaborators");
};

export const addCollaborator = async (collaboratorData) => {
    const response = await fetch(`${API_URL}/collaborators`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(collaboratorData)
    });
    return handleResponse(response, "Failed to add collaborator");
};

export const removeCollaborator = async (id) => {
    const response = await fetch(`${API_URL}/collaborators/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to remove collaborator");
};

// ==================== OVERDUE ALERT APIs ====================

export const getOverdueAlerts = async () => {
    const response = await fetch(`${API_URL}/overdue-alerts`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to fetch overdue alerts");
};

export const dismissOverdueAlert = async (invoiceId) => {
    const response = await fetch(`${API_URL}/overdue-alerts/${invoiceId}/dismiss`, {
        method: "PATCH",
        headers: getAuthHeaders()
    });
    return handleResponse(response, "Failed to dismiss overdue alert");
};