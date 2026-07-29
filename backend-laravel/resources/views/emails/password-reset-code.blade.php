<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; background: #f4f5f7; padding: 24px; margin: 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
        <tr>
            <td style="background: #4338ca; padding: 20px 28px;">
                <span style="color: #ffffff; font-size: 18px; font-weight: 700;">SSDMS</span>
            </td>
        </tr>
        <tr>
            <td style="padding: 28px;">
                <p style="font-size: 15px; color: #111827; margin: 0 0 16px;">
                    Your password reset verification code is:
                </p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4338ca; text-align: center; padding: 16px 0;">
                    {{ $code }}
                </div>
                <p style="font-size: 14px; color: #374151; margin: 16px 0 0;">
                    This verification code will expire in <strong>10 minutes</strong>.
                </p>
                <p style="font-size: 13px; color: #6b7280; margin: 20px 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                    If you did not request a password reset, please ignore this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
