import mockData from '../mock/mockData.json';

const BASE_URL = 'http://127.0.0.1:8000';

export const api = {
  async getEnquiries() {
    try {
      const response = await fetch(`${BASE_URL}/enquiry`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, falling back to mock enquiries");
    }
    return mockData.enquiries;
  },

  async createEnquiry(customerName: string, channel: string, message: string) {
    try {
      const response = await fetch(`${BASE_URL}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          channel: channel,
          message: message
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, simulating mock creation");
    }
    // Simulate creation offline
    return {
      enquiry_id: `enq_${Math.random().toString(36).substring(2, 9)}`,
      status: 'queued',
      message: 'Enquiry received and queued for processing (Simulated locally)'
    };
  },

  async getHistory(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/enquiry/${id}/history`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn(`Backend server down or unreachable, falling back to mock history for ${id}`);
    }
    const histories = mockData.histories as any;
    return histories[id] || null;
  },

  async scheduleFollowup(id: string, delayInMinutes: number, messageTemplate?: string) {
    try {
      const response = await fetch(`${BASE_URL}/enquiry/${id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delay_in_minutes: delayInMinutes,
          message_template: messageTemplate
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn(`Backend server down or unreachable, simulating follow-up scheduling for ${id}`);
    }
    return { id: `fol_${Date.now()}`, enquiry_id: id, delay_in_minutes: delayInMinutes, status: 'pending' };
  },

  async resolveEscalation(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/enquiry/${id}/resolve`, {
        method: 'POST'
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn(`Backend server down or unreachable, simulating escalation resolve for ${id}`);
    }
    return { id, status: 'qualified' };
  },

  async getFollowups() {
    try {
      const response = await fetch(`${BASE_URL}/followup`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, falling back to mock followups");
    }
    return mockData.followups;
  },

  async completeFollowup(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/followup/${id}/complete`, {
        method: 'POST'
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn(`Backend server down or unreachable, simulating follow-up completion for ${id}`);
    }
    return { id, status: 'executed' };
  }
};
