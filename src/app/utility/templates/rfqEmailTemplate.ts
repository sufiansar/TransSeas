export const rfqEmailTemplate = (data: {
  emailSubject: string;
  emailBody: string;
  companyName?: string;
  rfqNo?: string;
}) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f6f8fb;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        background: #fff;
        padding: 25px;
        border-radius: 8px;
      }
      h2 {
        color: #0a3cff;
        margin-bottom: 10px;
      }
      .subject {
        font-size: 14px;
        color: #555;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Request For Quotation</h2>
      <div class="subject"><strong>Subject:</strong> ${data.emailSubject}</div>

      <div style="line-height: 1.6; white-space: pre-line">
        ${data.emailBody}
      </div>
    </div>
  </body>
</html>
`;
