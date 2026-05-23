import mockData from '../mock/mockData.json';

// In-memory state storage for offline simulation
let localEnquiries = [...mockData.enquiries];
let localFollowups = [...mockData.followups];

// Maintain a helper mapping for histories
let localHistories = { ...mockData.histories } as Record<string, any>;

const BASE_URL = 'http://127.0.0.1:8000';

export const api = {
  async getEnquiries() {
    try {
      const response = await fetch(`${BASE_URL}/enquiry`);
      if (response.ok) {
        const data = await response.json();
        localEnquiries = data;
        return data;
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, falling back to mock enquiries");
    }
    return localEnquiries;
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
        const result = await response.json();
        // Warm up local cache with the newly created enquiry
        const newEnq = {
          id: result.enquiry_id,
          customer_name: customerName,
          channel: channel,
          status: 'new',
          message: message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localEnquiries = [newEnq, ...localEnquiries];
        localHistories[result.enquiry_id] = {
          enquiry: newEnq,
          sop_matches: [],
          followups: [],
          events: [
            {
              id: `evt_1_${result.enquiry_id}`,
              enquiry_id: result.enquiry_id,
              event_type: "enquiry_created",
              payload: { channel, customer_name: customerName },
              created_at: new Date().toISOString()
            }
          ]
        };
        return result;
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, simulating mock creation");
    }

    // Simulate creation offline by updating local state
    const newId = `enq_${Math.random().toString(36).substring(2, 9)}`;
    const newEnq = {
      id: newId,
      customer_name: customerName,
      channel: channel,
      status: 'new', // starts as new, then we can auto-qualify after keyword check
      message: message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simulate SOP keyword matching offline
    const messageLower = message.toLowerCase();
    let matchedSOP = null;
    if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('how much') || messageLower.includes('pricing')) {
      matchedSOP = {
        id: `sop_${Date.now()}`,
        enquiry_id: newId,
        sop_label: "Pricing Question",
        suggested_response: "Hello! Our base plans start at $29/month. We also offer customized packages. Let us know if you want a detailed estimate.",
        matched_keywords: ["price", "cost"],
        created_at: new Date().toISOString()
      };
      newEnq.status = 'qualified';
    } else if (messageLower.includes('book') || messageLower.includes('reserve') || messageLower.includes('appointment') || messageLower.includes('schedule')) {
      matchedSOP = {
        id: `sop_${Date.now()}`,
        enquiry_id: newId,
        sop_label: "Booking Enquiry",
        suggested_response: "Hi! I can help you book an appointment. Please let us know your preferred date and time, or visit our booking link.",
        matched_keywords: ["book", "appointment"],
        created_at: new Date().toISOString()
      };
      newEnq.status = 'qualified';
    } else if (messageLower.includes('complain') || messageLower.includes('bad') || messageLower.includes('broke') || messageLower.includes('fail') || messageLower.includes('worst')) {
      matchedSOP = {
        id: `sop_${Date.now()}`,
        enquiry_id: newId,
        sop_label: "Complaint",
        suggested_response: "We apologize for the inconvenience. We have logged your complaint and our customer support lead will reach out to you within the hour.",
        matched_keywords: ["complain", "bad"],
        created_at: new Date().toISOString()
      };
      newEnq.status = 'qualified';
    } else if (messageLower.includes('refund') || messageLower.includes('money back') || messageLower.includes('cancel')) {
      matchedSOP = {
        id: `sop_${Date.now()}`,
        enquiry_id: newId,
        sop_label: "Refund Request",
        suggested_response: "Thank you for reaching out. We process refund requests under our 14-day policy. Please provide your order or invoice ID.",
        matched_keywords: ["refund", "cancel"],
        created_at: new Date().toISOString()
      };
      newEnq.status = 'qualified';
    } else if (messageLower.includes('emergency') || messageLower.includes('urgent') || messageLower.includes('help')) {
      matchedSOP = {
        id: `sop_${Date.now()}`,
        enquiry_id: newId,
        sop_label: "After-hours Support",
        suggested_response: "Our office is currently closed. For emergency support, please call +1 (555) 0199. Standard issues will be resolved on the next business day.",
        matched_keywords: ["urgent", "help"],
        created_at: new Date().toISOString()
      };
      newEnq.status = 'qualified';
    } else {
      // Auto-escalated (No matching SOP keywords found)
      newEnq.status = 'escalated';
    }

    localEnquiries = [newEnq, ...localEnquiries];

    // Create history entry
    localHistories[newId] = {
      enquiry: newEnq,
      sop_matches: matchedSOP ? [matchedSOP] : [],
      followups: [],
      events: [
        {
          id: `evt_1_${newId}`,
          enquiry_id: newId,
          event_type: "enquiry_created",
          payload: { channel, customer_name: customerName },
          created_at: new Date().toISOString()
        },
        matchedSOP ? {
          id: `evt_2_${newId}`,
          enquiry_id: newId,
          event_type: "sop_matched",
          payload: { sop_label: matchedSOP.sop_label, matched_keywords: matchedSOP.matched_keywords },
          created_at: new Date().toISOString()
        } : {
          id: `evt_2_${newId}`,
          enquiry_id: newId,
          event_type: "escalation_triggered",
          payload: { reason: "Auto-escalated: No matching SOP found" },
          created_at: new Date().toISOString()
        },
        {
          id: `evt_3_${newId}`,
          enquiry_id: newId,
          event_type: "task_processed",
          payload: { processed_at: new Date().toISOString() },
          created_at: new Date().toISOString()
        }
      ]
    };

    return {
      enquiry_id: newId,
      status: 'queued',
      message: 'Enquiry received and queued for processing (Simulated locally)'
    };
  },

  async getHistory(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/enquiry/${id}/history`);
      if (response.ok) {
        const data = await response.json();
        localHistories[id] = data;
        return data;
      }
    } catch (e) {
      console.warn(`Backend server down or unreachable, falling back to mock history for ${id}`);
    }
    return localHistories[id] || null;
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

    const newFollowup = {
      id: `fol_${Date.now()}`,
      enquiry_id: id,
      customer_name: localHistories[id]?.enquiry?.customer_name || "Valued Customer",
      delay_in_minutes: delayInMinutes,
      message_template: messageTemplate || "Follow-up reminder checking back on customer request.",
      message_preview: messageTemplate || "Follow-up reminder checking back on customer request.",
      status: 'pending',
      scheduled_for: new Date(Date.now() + delayInMinutes * 60 * 1000).toISOString(),
      due_time: new Date(Date.now() + delayInMinutes * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    localFollowups = [newFollowup, ...localFollowups];

    // Append to history events
    if (localHistories[id]) {
      if (!localHistories[id].followups) localHistories[id].followups = [];
      localHistories[id].followups.push(newFollowup);
      localHistories[id].events.push({
        id: `evt_fol_${Date.now()}`,
        enquiry_id: id,
        event_type: "followup_created",
        payload: { followup_id: newFollowup.id, delay_in_minutes: delayInMinutes },
        created_at: new Date().toISOString()
      });
    }

    return newFollowup;
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

    // Resolve locally
    const enq = localEnquiries.find(e => e.id === id);
    if (enq) {
      enq.status = 'qualified';
      enq.updated_at = new Date().toISOString();
    }

    if (localHistories[id]) {
      localHistories[id].enquiry.status = 'qualified';
      localHistories[id].events.push({
        id: `evt_res_${Date.now()}`,
        enquiry_id: id,
        event_type: "escalation_resolved",
        payload: { resolved_at: new Date().toISOString() },
        created_at: new Date().toISOString()
      });
    }

    return { id, status: 'qualified' };
  },

  async getFollowups() {
    try {
      const response = await fetch(`${BASE_URL}/followup`);
      if (response.ok) {
        const data = await response.json();
        localFollowups = data;
        return data;
      }
    } catch (e) {
      console.warn("Backend server down or unreachable, falling back to mock followups");
    }
    return localFollowups;
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

    // Complete locally (remove pending followup item)
    localFollowups = localFollowups.filter(f => f.id !== id);
    
    // Log complete event in history
    Object.keys(localHistories).forEach(enqId => {
      const fList = localHistories[enqId].followups || [];
      const match = fList.find((f: any) => f.id === id);
      if (match) {
        match.status = 'executed';
        localHistories[enqId].events.push({
          id: `evt_fol_done_${Date.now()}`,
          enquiry_id: enqId,
          event_type: "followup_executed",
          payload: { followup_id: id },
          created_at: new Date().toISOString()
        });
      }
    });

    return { id, status: 'executed' };
  }
};
