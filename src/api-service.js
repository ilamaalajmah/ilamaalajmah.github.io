const API_TOKEN = "66ef19783ed5bb4d0bf2cdd3";
const API_URL = `https://${API_TOKEN}.mockapi.io`;

class ApiService {
  async createSubmission(submission) {
    try {
      const response = await fetch(`${API_URL}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (!response.ok) throw new Error("فشل في إنشاء التقديم");
      return await response.json();
    } catch (error) {
      console.error("خطأ في إنشاء التقديم:", error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/submissions`);
      if (!response.ok) throw new Error("فشل في جلب قائمة المتصدرين");
      const submissions = await response.json();
      return this.processLeaderboard(submissions);
    } catch (error) {
      console.error("خطأ في جلب قائمة المتصدرين:", error);
      throw error;
    }
  }

  processLeaderboard(submissions) {
    const userBestSubmissions = new Map();

    submissions.forEach((submission) => {
      const existingBest = userBestSubmissions.get(submission.name);
      if (!existingBest || submission.score > existingBest.score) {
        userBestSubmissions.set(submission.name, submission);
      }
    });

    return Array.from(userBestSubmissions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}

export const apiService = new ApiService();
