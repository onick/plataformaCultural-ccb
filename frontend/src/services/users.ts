/**
 * Users API Service - Specialized service for user management
 * Handles all user-related API operations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  is_admin: boolean;
  center: string;
  role: string;
  created_at: string;
  last_login?: string;
  total_reservations?: number;
  total_checkins?: number;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  location: string;
  center?: string;
  role?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  location?: string;
  is_admin?: boolean;
  center?: string;
  role?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface BulkUserAction {
  user_ids: string[];
  action: 'delete' | 'activate' | 'make_admin' | 'remove_admin';
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  admin_users: number;
  users_by_location: Array<{_id: string; count: number}>;
}

export interface BulkImportResult {
  total_processed: number;
  successful_imports: number;
  failed_imports: number;
  duplicate_emails: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  imported_users: Array<{
    email: string;
    name: string;
  }>;
}

class UsersService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Users API Error:', error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }

  // Get users with filters and pagination
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    location?: string;
    is_admin?: boolean;
  }): Promise<PaginatedResponse<User>> {
    console.log('🔄 Users API: Getting users...', params);
    
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.is_admin !== undefined) queryParams.append('is_admin', params.is_admin.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    
    const rawResult = await this.handleResponse<any>(response);
    
    // Transform backend response to expected frontend format
    const result: PaginatedResponse<User> = {
      items: rawResult.users || [],
      total: rawResult.total || 0,
      page: rawResult.page || 1,
      page_size: params?.limit || 20,
      total_pages: rawResult.pages || 1,
      has_next: rawResult.page < rawResult.pages,
      has_previous: rawResult.page > 1,
    };
    
    console.log('✅ Users API: Users retrieved:', result.total);
    return result;
  }

  // Get user by ID
  async getUser(userId: string): Promise<User> {
    console.log('🔄 Users API: Getting user...', userId);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
    
    const result = await this.handleResponse<User>(response);
    console.log('✅ Users API: User retrieved:', result.email);
    return result;
  }

  // Create new user (uses registration endpoint)
  async createUser(userData: UserCreate): Promise<User> {
    console.log('🔄 Users API: Creating user...', userData.email);
    
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    const result = await this.handleResponse<User>(response);
    console.log('✅ Users API: User created:', result.email);
    return result;
  }

  // Update user
  async updateUser(userId: string, updateData: UserUpdate): Promise<User> {
    console.log('🔄 Users API: Updating user...', userId);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    
    const result = await this.handleResponse<User>(response);
    console.log('✅ Users API: User updated:', result.email);
    return result;
  }

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<void> {
    console.log('🔄 Users API: Deleting user...', userId);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Users API: Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error}`);
    }
    
    console.log('✅ Users API: User deleted successfully');
  }

  // Bulk user actions
  async bulkUserAction(actionData: BulkUserAction): Promise<{modified_count: number}> {
    console.log('🔄 Users API: Performing bulk user action...', actionData.action);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/bulk-action`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(actionData),
    });
    
    const result = await this.handleResponse<{modified_count: number}>(response);
    console.log('✅ Users API: Bulk action completed:', result.modified_count);
    return result;
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    console.log('🔄 Users API: Getting user statistics...');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users-metrics`, {
      headers: this.getAuthHeaders(),
    });
    
    const result = await this.handleResponse<UserStats>(response);
    console.log('✅ Users API: User stats retrieved');
    return result;
  }

  // Import users from CSV
  async importUsers(file: File): Promise<BulkImportResult> {
    console.log('🔄 Users API: Importing users from CSV...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/admin/users/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });
    
    const result = await this.handleResponse<BulkImportResult>(response);
    console.log('✅ Users API: Users imported:', result.successful_imports);
    return result;
  }

  // Search users (helper method for typeahead/autocomplete)
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const response = await this.getUsers({
      search: query,
      limit,
      skip: 0
    });
    return response.items;
  }

  // Get user roles/permissions info
  async getUserRoles(): Promise<{role: string; permissions: string[]}> {
    // This would be implemented based on your role system
    // For now, return basic info
    return {
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin']
    };
  }
}

// Export singleton instance
export const usersService = new UsersService();
export default usersService;