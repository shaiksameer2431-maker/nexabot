import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Notification API endpoint
  app.post("/api/notify", async (req, res) => {
    const { ticketId, studentName, email, phone, status, adminResponse } = req.body;
    
    // Simulate sending notifications via API (Twilio / Nodemailer in real scenario)
    console.log(`[API NOTIFICATION TRIGGERED]`);
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`Sending to: ${studentName}`);
    
    if (email) {
      console.log(`-> Email Sent to: ${email}`);
      console.log(`   Content: Your ticket (${ticketId}) is ${status}. \nResponse: ${adminResponse}`);
    }
    
    if (phone) {
      console.log(`-> SMS Sent to: ${phone}`);
      console.log(`   Content: NEXA Support: Ticket ${ticketId} is ${status}.`);
      console.log(`-> WhatsApp Sent to: ${phone}`);
      console.log(`   Content: *NEXA Support*: Ticket ${ticketId} is ${status}. \nReply: ${adminResponse}`);
    }

    // In a real integration, you would initialize Twilio client and Nodemailer here
    // using process.env.TWILIO_ACCOUNT_SID etc.
    
    res.json({ success: true, message: "Notifications sent via API" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
