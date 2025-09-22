// API service that works both locally and on Netlify
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/api'
    : '/api';
class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    // Members API
    async getMembers() {
        return this.request('/members');
    }
    async createMember(member) {
        return this.request('/members', {
            method: 'POST',
            body: JSON.stringify(member),
        });
    }
    // Categories API
    async getCategories() {
        return this.request('/categories');
    }
    async createCategory(category) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(category),
        });
    }
    // Transactions API
    async getTransactions() {
        return this.request('/transactions');
    }
    async createTransaction(transaction) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
    }
    async updateTransaction(id, transaction) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction),
        });
    }
    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE',
        });
    }
}
export const apiService = new ApiService();
export default apiService;
