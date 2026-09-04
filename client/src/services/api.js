const API_URL = "http://localhost:5000/api";

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data;
};

export const registerUser = async (formData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Registration failed");
    }

    return data;
};

const getToken = () => {
    return localStorage.getItem("token");
};

export const getSubscriptions = async () => {
    const response = await fetch(`${API_URL}/subscriptions`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch subscriptions");
    }

    return data;
};

export const getInvoices = async (params = "") => {
    const response = await fetch(
        `${API_URL}/invoices${params ? `?${params}` : ""}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invoices");
    }

    return data;
};

export const getOverdueInvoices = async () => {
    const response = await fetch(`${API_URL}/invoices/overdue`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch overdue invoices");
    }

    return data;
};