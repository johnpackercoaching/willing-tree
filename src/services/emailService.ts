// Email Service for The Willing Tree
import { Resend } from 'resend';

// Initialize Resend (will be null in development without API key)
const resend = import.meta.env.VITE_RESEND_API_KEY 
  ? new Resend(import.meta.env.VITE_RESEND_API_KEY)
  : null;

export interface InviteEmailData {
  partnerEmail: string;
  senderName: string;
  senderEmail: string;
  inviteMessage?: string;
  appUrl: string;
}

export const sendInviteEmail = async (data: InviteEmailData): Promise<{ success: boolean; message: string }> => {
  // If email is disabled or no API key, return simulation
  if (!import.meta.env.VITE_ENABLE_EMAIL || !resend) {
    // console.log('📧 EMAIL SIMULATION MODE:');
    // console.log('To:', data.partnerEmail);
    // console.log('From:', data.senderEmail);
    // console.log('Invite Link:', data.appUrl);
    
    // Copy invite link to clipboard for easy sharing
    try {
      await navigator.clipboard.writeText(data.appUrl);
      // console.log('✅ Invite link copied to clipboard!');
    } catch (err) {
      // console.log('❌ Could not copy to clipboard:', err);
    }
    
    // Show the invite link in an alert for testing
    alert(`📧 Email Simulation Mode\n\nSince email sending is disabled, here's the invite link:\n\n${data.appUrl}\n\n✅ Link has been copied to your clipboard!\nShare it with ${data.partnerEmail}`);
    
    return {
      success: true,
      message: `Invite link copied! Share it with ${data.partnerEmail}`
    };
  }

  try {
    const emailHtml = generateInviteEmail(data);
    
    const result = await resend.emails.send({
      from: import.meta.env.VITE_FROM_EMAIL || 'hello@willingtree.app',
      to: data.partnerEmail,
      subject: `${data.senderName} invited you to grow your relationship with The Willing Tree 🌳`,
      html: emailHtml,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      message: `Invitation sent successfully to ${data.partnerEmail}`
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

const generateInviteEmail = (data: InviteEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to The Willing Tree</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
    .header .emoji { font-size: 48px; margin-bottom: 16px; }
    .content { padding: 40px 30px; }
    .message { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🌳</div>
      <h1>You're Invited to The Willing Tree</h1>
      <p style="color: #d1fae5; margin: 8px 0 0 0;">Nurture your relationship through intentional growth</p>
    </div>
    
    <div class="content">
      <p>Hi there! 👋</p>
      
      <p><strong>${data.senderName}</strong> (${data.senderEmail}) has invited you to join The Willing Tree - a beautiful way to grow your relationship together through weekly intentional actions.</p>
      
      ${data.inviteMessage ? `
      <div class="message">
        <h3 style="margin-top: 0; color: #065f46;">💌 Personal Message from ${data.senderName}:</h3>
        <p style="font-style: italic;">"${data.inviteMessage}"</p>
      </div>
      ` : ''}
      
      <h3 style="color: #065f46;">🌱 How The Willing Tree Works:</h3>
      <ul>
        <li><strong>Plant Your Wishes:</strong> Each person creates a list of relationship hopes (up to 20 items)</li>
        <li><strong>Select What You'll Work On:</strong> Choose 5 of your partner's wishes you're willing to nurture</li>
        <li><strong>Weekly Growth Games:</strong> Play guessing games and earn points for growth</li>
        <li><strong>Privacy Protected:</strong> Your partner never sees what you didn't select - preserving your autonomy</li>
      </ul>
      
      <div class="cta">
        <a href="${data.appUrl}" class="button">🚀 Join The Willing Tree</a>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <small style="color: #6b7280;">
          Perfect for romantic relationships, close friendships, and family bonds.<br>
          Free to start - Pay what you feel it's worth after experiencing the value.
        </small>
      </p>
    </div>
    
    <div class="footer">
      <p>🌳 <strong>The Willing Tree</strong> - Growing relationships through intentional actions</p>
      <p>If you don't wish to receive invitations, you can ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};