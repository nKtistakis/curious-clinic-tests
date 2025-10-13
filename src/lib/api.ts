const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
  };
}

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    retry = true
  ): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401 && retry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.fetchWithAuth(url, options, false);
      }
      throw new ApiError("Unauthorized", 401);
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credentials }),
    });
    console.log(response);

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || "Login failed", response.status);
    }

    return response.json();
  }

  async getTests(testId?: string): Promise<any[]> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/tests?${testId ? "_id=" + testId : ""}`
    );

    if (!response.ok) {
      throw new ApiError("Failed to fetch tests", response.status);
    }
    const data = (await response.json())["data"];

    return data;
  }

  async createTest(test: any): Promise<any> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/tests/new`, {
      method: "POST",
      body: JSON.stringify({ test }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to create test", response.status);
    }

    return response.json();
  }

  async updateTest(testId: string, test: any): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/tests?_id=${testId}`,
      {
        method: "PATCH",
        body: JSON.stringify(test),
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to update test", response.status);
    }

    return response.json();
  }

  async deleteTest(testId: string): Promise<void> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/tests?_id=${testId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to delete test", response.status);
    }
  }

  async getAssignedTests(testId?: string): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/tests/assigned${testId ? `?_id=${testId}` : ""}`
    );

    if (!response.ok) {
      throw new ApiError("Failed to fetch tests", response.status);
    }
    const data = (await response.json())["data"];

    return data;
  }

  async postTestProgress(testId: string, progress: any): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/test-progress`, {
      method: "POST",
      body: JSON.stringify({ testId, progress }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to save test progress", response.status);
    }
  }

  async postTestResult(testId: string, result: any): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/test-results`, {
      method: "POST",
      body: JSON.stringify({ testId, result }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to submit test result", response.status);
    }
  }

  async getTestProgress(testId: string): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/test-progress/${testId}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new ApiError("Failed to fetch test progress", response.status);
    }

    const data = (await response.json())["data"];

    return data;
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  }

  async checkAuth(): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Doctor management
  async getDoctorInfo(): Promise<any> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/doctors`);

    if (!response.ok) {
      throw new ApiError("Failed to fetch doctor info", response.status);
    }

    const data = (await response.json())["data"];
    return data;
  }

  // Question categories
  async getQuestionCategories(): Promise<any[]> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/question_categories`
    );

    if (!response.ok) {
      throw new ApiError(
        "Failed to fetch question categories",
        response.status
      );
    }

    const data = (await response.json())["data"];
    return data;
  }

  // Patient management
  async getPatients(): Promise<any[]> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/patients`);

    if (!response.ok) {
      throw new ApiError("Failed to fetch patients", response.status);
    }

    const data = (await response.json())["data"];

    return data;
  }

  async createPatient(patient: any): Promise<any> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/patients/new`, {
      method: "POST",
      body: JSON.stringify({ patient }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to create patient", response.status);
    }

    return response.json();
  }

  async updatePatient(patientId: string, patient: any): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/patients?id=${patientId}`,
      {
        method: "PATCH",
        body: JSON.stringify(patient),
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to update patient", response.status);
    }

    return response.json();
  }

  async deletePatient(patientId: string): Promise<void> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/patients/delete?_id=${patientId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to delete patient", response.status);
    }
  }

  // Condition management
  async getConditions(): Promise<any[]> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/conditions`);

    if (!response.ok) {
      throw new ApiError("Failed to fetch conditions", response.status);
    }

    const data = (await response.json())["data"];

    return data;
  }

  async createCondition(condition: any): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/conditions/new`,
      {
        method: "POST",
        body: JSON.stringify(condition),
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to create condition", response.status);
    }

    return response.json();
  }

  async updateCondition(conditionId: string, condition: any): Promise<any> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/conditions?_id=${conditionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(condition),
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to update condition", response.status);
    }

    return response.json();
  }

  async deleteCondition(conditionId: string): Promise<void> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/conditions?_id=${conditionId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to delete condition", response.status);
    }
  }

  // Test assignment and submission
  async assignTest(data: {
    testId: string;
    patientId: string;
    validDays?: number;
    timerType?: "timer" | "stopwatch" | null;
    timerValue?: number;
  }): Promise<any> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/tests/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError("Failed to assign test", response.status);
    }

    return response.json();
  }

  async submitAnswer(data: {
    _id: string;
    question: string;
    answer: string;
  }): Promise<void> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}/tests/submit-answer`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new ApiError("Failed to submit answer", response.status);
    }
  }

  async finishTest(
    testAssignmentId: string,
    data: {
      score: number;
      totalQuestions: number;
      percentage: number;
      answers: any[];
      notes?: string;
    }
  ): Promise<any> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/tests/finish`, {
      method: "POST",
      body: JSON.stringify({ testAssignmentId, ...data }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to finish test", response.status);
    }

    return response.json();
  }
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const apiClient = new ApiClient();
export { ApiError };
export type { LoginCredentials, AuthResponse };
