/**
 * WhatsApp Integration Helper
 * Uses click-to-chat API (wa.me) for sending pre-filled messages
 */

export interface ReminderData {
    tenantName: string;
    tenantPhone: string;
    amount: number;
    propertyName: string;
    unitNumber: string;
    dueDate: string;
    landlordName: string;
    paybill?: string;
    accountNumber?: string;
}

/**
 * Format phone number for WhatsApp API
 * Converts Kenyan numbers to international format
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
        // 0712345678 -> 254712345678
        cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
        // 712345678 -> 254712345678
        cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+')) {
        // Already has +, just remove it
        cleaned = cleaned.substring(1);
    }

    return cleaned;
}

/**
 * Generate payment reminder message
 */
export function generateReminderMessage(data: ReminderData): string {
    const { tenantName, amount, propertyName, unitNumber, dueDate, landlordName, paybill, accountNumber } = data;

    const formattedAmount = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
    }).format(amount);

    let message = `Hi ${tenantName}! 👋

This is a friendly reminder that your rent of ${formattedAmount} for ${propertyName} - Unit ${unitNumber} is due on ${dueDate}.
`;

    if (paybill) {
        message += `
💳 *Pay via M-Pesa:*
1. Go to M-Pesa menu
2. Select Lipa na M-Pesa → Paybill
3. Enter Business No: ${paybill}
4. Account No: ${accountNumber || unitNumber}
5. Amount: ${amount}
`;
    }

    message += `
Or pay directly in the EstateFlow app.

Thank you! 🙏
- ${landlordName}`;

    return message;
}

/**
 * Generate WhatsApp click-to-chat URL
 */
export function generateWhatsAppLink(phone: string, message: string): string {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Generate gate pass share message
 */
export function generateGatePassMessage(data: {
    visitorName: string;
    accessCode: string;
    propertyName: string;
    unitNumber: string;
    validUntil: string;
    tenantName: string;
}): string {
    const { visitorName, accessCode, propertyName, unitNumber, validUntil, tenantName } = data;

    return `Hi ${visitorName}! 👋

${tenantName} has created a gate pass for you to visit ${propertyName} - Unit ${unitNumber}.

🔑 *Your Access Code:* ${accessCode}

📅 Valid until: ${validUntil}

Simply show this code to the security guard at the gate.

Safe travels! 🚗`;
}

/**
 * Generate overdue payment reminder (more urgent tone)
 */
export function generateOverdueMessage(data: ReminderData & { daysOverdue: number }): string {
    const { tenantName, amount, propertyName, unitNumber, daysOverdue, landlordName, paybill, accountNumber } = data;

    const formattedAmount = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
    }).format(amount);

    let message = `Hi ${tenantName},

Your rent payment of ${formattedAmount} for ${propertyName} - Unit ${unitNumber} is now *${daysOverdue} days overdue*.

Please make the payment as soon as possible to avoid any late fees.
`;

    if (paybill) {
        message += `
💳 *Pay via M-Pesa:*
Paybill: ${paybill}
Account: ${accountNumber || unitNumber}
Amount: ${amount}
`;
    }

    message += `
If you have already paid, please disregard this message and share the transaction confirmation.

Thank you,
${landlordName}`;

    return message;
}
