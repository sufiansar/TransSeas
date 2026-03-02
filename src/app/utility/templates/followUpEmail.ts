export const getFollowUpEmail = (
  vendorName: string,
  projectRef: string,
  rfqNo: string,
) => {
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    
    <p>Dear ${vendorName},</p>

    <p>I hope you are doing well.</p>

    <p>
      This is a kind reminder regarding the Request for Quotation (RFQ) 
      previously shared with you.
    </p>

    <table style="border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 6px 12px; font-weight: bold;">RFQ Number:</td>
        <td style="padding: 6px 12px;">${rfqNo}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-weight: bold;">Project Reference:</td>
        <td style="padding: 6px 12px;">${projectRef}</td>
      </tr>
    </table>

    <p>
      We would highly appreciate receiving your quotation at your earliest
      convenience to help us proceed with the procurement process.
    </p>

    <div style="margin-top: 25px;">
      <h3 style="margin-bottom: 10px;">Terms & Conditions</h3>
      <ul style="padding-left: 20px;">
        <li>Payment: Within 30 days from invoice date</li>
        <li>Delivery: As per agreed schedule</li>
        <li>Price Validity: Minimum 45 days</li>
        <li>Quality: Must comply with specified standards</li>
        <li>Delays: Must be communicated in advance</li>
      </ul>
    </div>

    <p>
      Official Terms & Conditions:<br/>
      <a href="https://transseas.com/terms-of-purchase">Terms of Purchase</a><br/>
      <a href="https://transseas.com/terms-of-sale">Terms of Sale</a>
    </p>

    <p>
      Please share your best pricing along with the expected delivery timeline
      at your earliest convenience.
    </p>

    <p>
      If you require any clarification, feel free to contact our procurement team.
    </p>

    <br/>

    <p>
      Kind regards,<br/>
      <strong>TransSeas Procurement Team</strong><br/>
      Procurement Department<br/>
      TransSeas
    </p>

  </div>
  `;
};
