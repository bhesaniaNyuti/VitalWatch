import { API_BASE_URL } from '../utils/constants';

class ApiService {
    async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        return response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

export default new ApiService();
